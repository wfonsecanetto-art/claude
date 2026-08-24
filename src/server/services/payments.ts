import { db } from "../db";
import { writeAudit } from "../audit";
import { LEVEL_POLICY } from "../credit/rates";
import { levelForPoints } from "../credit/score";
import {
  ACCOUNT_KINDS,
  getPlatformAccount,
  getWalletAccount,
  post,
  walletBalance,
} from "../ledger";
import type { Cents } from "../money";
import { paymentRail } from "../rails/payment";
import { recalculateScore } from "./scoring";

/**
 * Pagamento de parcelas, quitação e cashback.
 *
 * Parcelas são pagas em ordem: não faz sentido quitar a parcela 5 com a 3 em
 * aberto, e permitir isso embaralha a régua de cobrança.
 */

export type PaymentMethod = "WALLET_BALANCE" | "PIX" | "BOLETO";

export async function payInstallment(params: {
  userId: string;
  installmentId: string;
  method: PaymentMethod;
  ip?: string | null;
}) {
  const installment = await db.installment.findUniqueOrThrow({
    where: { id: params.installmentId },
    include: { contract: true },
  });

  if (installment.contract.userId !== params.userId) throw new Error("Parcela de outro cliente");
  if (installment.status === "PAID") throw new Error("Parcela já quitada");

  const older = await db.installment.findFirst({
    where: {
      contractId: installment.contractId,
      number: { lt: installment.number },
      status: { not: "PAID" },
    },
    orderBy: { number: "asc" },
  });
  if (older) throw new Error(`Quite antes a parcela ${older.number}.`);

  const amount = installment.totalCents - installment.paidCents;

  if (params.method === "WALLET_BALANCE") {
    const balance = await walletBalance(params.userId);
    if (balance < amount) throw new Error("Saldo insuficiente na Conta Valor.");
  }

  const charge =
    params.method === "WALLET_BALANCE"
      ? { provider: "INTERNAL", reference: `INT-${installment.id.slice(0, 10).toUpperCase()}` }
      : await paymentRail.createCharge({
          amountCents: amount,
          description: `Parcela ${installment.number} do contrato ${installment.contract.number}`,
          payerDocument: "",
          method: params.method === "PIX" ? "PIX" : "BOLETO",
        });

  await db.$transaction(async (tx) => {
    const [wallet, funding, receivable, revenue] = await Promise.all([
      getWalletAccount(params.userId, tx),
      getPlatformAccount(ACCOUNT_KINDS.FUNDING, tx),
      getPlatformAccount(ACCOUNT_KINDS.RECEIVABLE, tx),
      getPlatformAccount(ACCOUNT_KINDS.REVENUE, tx),
    ]);

    // Origem do dinheiro muda conforme o meio; o destino é sempre o mesmo:
    // amortiza o recebível e reconhece os juros como receita.
    const sourceAccountId = params.method === "WALLET_BALANCE" ? wallet.id : funding.id;

    const transaction = await post(tx, {
      kind: "INSTALLMENT_PAYMENT",
      description: `Parcela ${installment.number}/${installment.contract.termMonths} do contrato ${installment.contract.number}`,
      reference: installment.contract.number,
      entries: [
        { accountId: sourceAccountId, direction: "DEBIT", amountCents: amount },
        { accountId: receivable.id, direction: "CREDIT", amountCents: installment.principalCents },
        { accountId: revenue.id, direction: "CREDIT", amountCents: installment.interestCents },
      ],
    });

    await tx.payment.create({
      data: {
        contractId: installment.contractId,
        installmentId: installment.id,
        amountCents: amount,
        method: params.method,
        railReference: charge.reference,
        railProvider: charge.provider,
        transactionId: transaction.id,
      },
    });

    await tx.installment.update({
      where: { id: installment.id },
      data: {
        paidCents: installment.totalCents,
        status: "PAID",
        paidAt: new Date(),
      },
    });
  });

  await writeAudit({
    actorId: params.userId,
    action: "payment.installment",
    entity: "Installment",
    entityId: installment.id,
    metadata: { amountCents: amount, method: params.method, rail: charge.provider },
    ip: params.ip,
  });

  await settleContractIfComplete(installment.contractId, params.userId);
  await recalculateScore(params.userId, `Parcela ${installment.number} paga`);

  return { amountCents: amount, reference: charge.reference };
}

/**
 * Fecha o contrato quando não resta parcela em aberto e concede o cashback.
 *
 * O cashback é condicionado à quitação integral, como diz a regra do produto —
 * e é calculado sobre os juros efetivamente pagos, não sobre o principal.
 */
async function settleContractIfComplete(contractId: string, userId: string) {
  const open = await db.installment.count({
    where: { contractId, status: { not: "PAID" } },
  });
  if (open > 0) return;

  const contract = await db.contract.findUniqueOrThrow({
    where: { id: contractId },
    include: { installments: true },
  });
  if (contract.status === "SETTLED") return;

  const snapshot = await db.scoreSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const level = levelForPoints(snapshot?.points ?? 0);
  const totalInterest = contract.installments.reduce((sum, item) => sum + item.interestCents, 0);
  const cashback = Math.round(
    (totalInterest * LEVEL_POLICY[level].cashbackOnInterestBps) / 10000,
  );

  await db.$transaction(async (tx) => {
    await tx.contract.update({
      where: { id: contractId },
      data: { status: "SETTLED", settledAt: new Date() },
    });

    if (cashback > 0) {
      const [wallet, pool] = await Promise.all([
        getWalletAccount(userId, tx),
        getPlatformAccount(ACCOUNT_KINDS.CASHBACK_POOL, tx),
      ]);

      await post(tx, {
        kind: "CASHBACK",
        description: `Cashback pela quitação integral do contrato ${contract.number}`,
        reference: contract.number,
        entries: [
          { accountId: pool.id, direction: "DEBIT", amountCents: cashback },
          { accountId: wallet.id, direction: "CREDIT", amountCents: cashback },
        ],
      });

      await tx.cashbackGrant.create({
        data: { userId, contractId, amountCents: cashback },
      });
    }
  });

  await writeAudit({
    actorId: userId,
    action: "credit.contract.settled",
    entity: "Contract",
    entityId: contractId,
    metadata: { number: contract.number, cashbackCents: cashback },
  });
}

/** Depósito na Conta Valor pelo trilho sandbox. */
export async function depositToWallet(params: {
  userId: string;
  amountCents: Cents;
  ip?: string | null;
}) {
  if (params.amountCents <= 0) throw new Error("Valor precisa ser positivo");

  const charge = await paymentRail.createCharge({
    amountCents: params.amountCents,
    description: "Depósito na Conta Valor",
    payerDocument: "",
    method: "PIX",
  });

  await db.$transaction(async (tx) => {
    const [wallet, funding] = await Promise.all([
      getWalletAccount(params.userId, tx),
      getPlatformAccount(ACCOUNT_KINDS.FUNDING, tx),
    ]);

    await post(tx, {
      kind: "DEPOSIT",
      description: `Depósito via ${charge.provider}`,
      reference: charge.reference,
      entries: [
        { accountId: funding.id, direction: "DEBIT", amountCents: params.amountCents },
        { accountId: wallet.id, direction: "CREDIT", amountCents: params.amountCents },
      ],
    });
  });

  await writeAudit({
    actorId: params.userId,
    action: "wallet.deposit",
    entity: "Account",
    metadata: { amountCents: params.amountCents, rail: charge.provider },
    ip: params.ip,
  });

  return charge;
}

/** Transferência entre contas da própria plataforma. */
export async function transfer(params: {
  fromUserId: string;
  toEmailOrCpf: string;
  amountCents: Cents;
  description?: string;
  ip?: string | null;
}) {
  if (params.amountCents <= 0) throw new Error("Valor precisa ser positivo");

  const normalized = params.toEmailOrCpf.trim().toLowerCase();
  const digits = normalized.replace(/\D/g, "");
  const recipient = await db.user.findFirst({
    where: {
      OR: [{ email: normalized }, ...(digits.length === 11 ? [{ cpf: digits }] : [])],
    },
  });

  if (!recipient) throw new Error("Destinatário não encontrado na plataforma.");
  if (recipient.id === params.fromUserId) throw new Error("Escolha outra conta de destino.");

  const balance = await walletBalance(params.fromUserId);
  if (balance < params.amountCents) throw new Error("Saldo insuficiente.");

  await db.$transaction(async (tx) => {
    const [from, to] = await Promise.all([
      getWalletAccount(params.fromUserId, tx),
      getWalletAccount(recipient.id, tx),
    ]);

    const transaction = await post(tx, {
      kind: "TRANSFER",
      description: params.description?.trim() || `Transferência para ${recipient.name}`,
      entries: [
        { accountId: from.id, direction: "DEBIT", amountCents: params.amountCents },
        { accountId: to.id, direction: "CREDIT", amountCents: params.amountCents },
      ],
    });

    await tx.transfer.create({
      data: {
        fromUserId: params.fromUserId,
        toUserId: recipient.id,
        amountCents: params.amountCents,
        description: params.description?.trim() || null,
        transactionId: transaction.id,
      },
    });
  });

  await writeAudit({
    actorId: params.fromUserId,
    action: "wallet.transfer",
    entity: "User",
    entityId: recipient.id,
    metadata: { amountCents: params.amountCents },
    ip: params.ip,
  });

  return { recipientName: recipient.name };
}

/** Marca como atrasadas as parcelas vencidas ainda em aberto. */
export async function refreshOverdue(userId?: string) {
  await db.installment.updateMany({
    where: {
      status: "OPEN",
      dueDate: { lt: new Date() },
      ...(userId ? { contract: { userId } } : {}),
    },
    data: { status: "LATE" },
  });
}
