import { db } from "../db";
import { writeAudit } from "../audit";
import { decide } from "../credit/policy";
import { quoteCredit, type CreditQuote } from "../credit/schedule";
import { ACCOUNT_KINDS, getPlatformAccount, getWalletAccount, post } from "../ledger";
import type { Cents } from "../money";
import { creditPosition, recalculateScore } from "./scoring";

/**
 * Ciclo de vida da operação de crédito: proposta → decisão → contrato →
 * assinatura → liberação.
 *
 * Cada passo é uma transação de banco: ou o contrato nasce inteiro, com
 * cronograma e lançamentos contábeis, ou não nasce.
 */

export async function simulate(params: {
  userId: string;
  amountCents: Cents;
  termMonths: number;
}): Promise<{ quote: CreditQuote; monthlyRateBps: number }> {
  const position = await creditPosition(params.userId);
  const quote = quoteCredit({
    requestedCents: params.amountCents,
    termMonths: params.termMonths,
    monthlyRateBps: position.limit.monthlyRateBps,
  });
  return { quote, monthlyRateBps: position.limit.monthlyRateBps };
}

export type ApplicationResult = {
  applicationId: string;
  outcome: "APPROVED" | "UNDER_REVIEW" | "REJECTED";
  reason: string;
  quote: CreditQuote;
};

/** Registra a proposta e aplica a política de crédito na hora. */
export async function apply(params: {
  userId: string;
  amountCents: Cents;
  termMonths: number;
  purpose: string;
  ip?: string | null;
}): Promise<ApplicationResult> {
  const [position, kyc, lateCount] = await Promise.all([
    creditPosition(params.userId),
    db.kycProfile.findUnique({ where: { userId: params.userId } }),
    db.installment.count({
      where: {
        contract: { userId: params.userId },
        status: { not: "PAID" },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  const quote = quoteCredit({
    requestedCents: params.amountCents,
    termMonths: params.termMonths,
    monthlyRateBps: position.limit.monthlyRateBps,
  });

  const decision = decide({
    score: position.score.points,
    kycApproved: kyc?.status === "APPROVED",
    amountCents: params.amountCents,
    installmentCents: quote.installmentCents,
    monthlyIncomeCents: kyc?.monthlyIncomeCents ?? 0,
    availableLimitCents: position.limit.availableCents,
    installmentsCurrentlyLate: lateCount,
  });

  const application = await db.creditApplication.create({
    data: {
      userId: params.userId,
      amountCents: params.amountCents,
      termMonths: params.termMonths,
      purpose: params.purpose,
      status: decision.outcome === "APPROVED" ? "APPROVED" : decision.outcome,
      decisionReason: decision.reason,
      scoreAtDecision: position.score.points,
      monthlyRateBps: quote.monthlyRateBps,
      iofCents: quote.iofCents,
      cetYearlyBps: quote.cetYearlyBps,
      totalPayableCents: quote.totalPayableCents,
      installmentCents: quote.installmentCents,
      decidedAt: decision.outcome === "UNDER_REVIEW" ? null : new Date(),
    },
  });

  if (decision.outcome === "APPROVED") {
    await createContractFor(application.id);
  }

  await writeAudit({
    actorId: params.userId,
    action: `credit.application.${decision.outcome.toLowerCase()}`,
    entity: "CreditApplication",
    entityId: application.id,
    metadata: {
      amountCents: params.amountCents,
      termMonths: params.termMonths,
      score: position.score.points,
      checks: decision.checks,
    },
    ip: params.ip,
  });

  return {
    applicationId: application.id,
    outcome: decision.outcome,
    reason: decision.reason,
    quote,
  };
}

function contractNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `VLR-${year}-${random}`;
}

/** Cria o contrato aguardando assinatura a partir de uma proposta aprovada. */
export async function createContractFor(applicationId: string) {
  const application = await db.creditApplication.findUniqueOrThrow({
    where: { id: applicationId },
  });

  const existing = await db.contract.findUnique({ where: { applicationId } });
  if (existing) return existing;

  const quote = quoteCredit({
    requestedCents: application.amountCents,
    termMonths: application.termMonths,
    monthlyRateBps: application.monthlyRateBps ?? 590,
  });

  return db.contract.create({
    data: {
      number: contractNumber(),
      applicationId: application.id,
      userId: application.userId,
      principalCents: application.amountCents,
      iofCents: quote.iofCents,
      monthlyRateBps: quote.monthlyRateBps,
      cetYearlyBps: quote.cetYearlyBps,
      termMonths: quote.termMonths,
      totalPayableCents: quote.totalPayableCents,
      status: "AWAITING_SIGNATURE",
    },
  });
}

/**
 * Assinatura e liberação, em uma única transação.
 *
 * Gera o cronograma a partir da data efetiva de liberação, credita a carteira
 * do cliente e registra as partidas contábeis. Se qualquer passo falhar, nada
 * é gravado — não existe contrato assinado sem dinheiro liberado.
 */
export async function signAndDisburse(params: {
  contractId: string;
  userId: string;
  signatureHash: string;
  ip?: string | null;
}) {
  const contract = await db.contract.findUniqueOrThrow({
    where: { id: params.contractId },
  });

  if (contract.userId !== params.userId) throw new Error("Contrato de outro cliente");
  if (contract.status !== "AWAITING_SIGNATURE") throw new Error("Contrato não está aguardando assinatura");

  const now = new Date();
  const quote = quoteCredit({
    requestedCents: contract.principalCents,
    termMonths: contract.termMonths,
    monthlyRateBps: contract.monthlyRateBps,
    startDate: now,
  });

  await db.$transaction(async (tx) => {
    await tx.installment.createMany({
      data: quote.installments.map((installment) => ({
        contractId: contract.id,
        number: installment.number,
        dueDate: installment.dueDate,
        principalCents: installment.principalCents,
        interestCents: installment.interestCents,
        totalCents: installment.totalCents,
      })),
    });

    const [wallet, receivable, revenue] = await Promise.all([
      getWalletAccount(contract.userId, tx),
      getPlatformAccount(ACCOUNT_KINDS.RECEIVABLE, tx),
      getPlatformAccount(ACCOUNT_KINDS.REVENUE, tx),
    ]);

    // Recebível nasce pelo valor financiado (principal + IOF); o cliente recebe
    // o principal e o IOF é reconhecido como tributo apurado.
    await post(tx, {
      kind: "DISBURSEMENT",
      description: `Liberação do contrato ${contract.number}`,
      reference: contract.number,
      entries: [
        { accountId: receivable.id, direction: "DEBIT", amountCents: quote.financedCents },
        { accountId: wallet.id, direction: "CREDIT", amountCents: contract.principalCents },
        { accountId: revenue.id, direction: "CREDIT", amountCents: quote.iofCents },
      ],
    });

    await tx.contract.update({
      where: { id: contract.id },
      data: {
        status: "ACTIVE",
        signedAt: now,
        signatureHash: params.signatureHash,
        disbursedAt: now,
        iofCents: quote.iofCents,
        cetYearlyBps: quote.cetYearlyBps,
        totalPayableCents: quote.totalPayableCents,
      },
    });

    await tx.creditApplication.update({
      where: { id: contract.applicationId },
      data: { status: "CONTRACTED" },
    });
  });

  await recalculateScore(params.userId, `Contrato ${contract.number} liberado`);
  await writeAudit({
    actorId: params.userId,
    action: "credit.contract.signed",
    entity: "Contract",
    entityId: contract.id,
    metadata: { number: contract.number, principalCents: contract.principalCents },
    ip: params.ip,
  });

  return contract;
}

/** Decisão manual do backoffice sobre uma proposta em análise. */
export async function reviewApplication(params: {
  applicationId: string;
  analystId: string;
  approve: boolean;
  reason: string;
  ip?: string | null;
}) {
  const application = await db.creditApplication.findUniqueOrThrow({
    where: { id: params.applicationId },
  });

  if (application.status !== "UNDER_REVIEW") {
    throw new Error("Proposta já decidida");
  }

  await db.creditApplication.update({
    where: { id: application.id },
    data: {
      status: params.approve ? "APPROVED" : "REJECTED",
      decisionReason: params.reason,
      decidedAt: new Date(),
      decidedById: params.analystId,
    },
  });

  if (params.approve) await createContractFor(application.id);

  await writeAudit({
    actorId: params.analystId,
    action: params.approve ? "credit.application.manual_approved" : "credit.application.manual_rejected",
    entity: "CreditApplication",
    entityId: application.id,
    metadata: { reason: params.reason },
    ip: params.ip,
  });
}
