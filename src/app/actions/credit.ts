"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveCustomer, requireUser } from "@/server/auth/guards";
import { clientIp } from "@/server/auth/session";
import { apply, signAndDisburse } from "@/server/services/credit";
import { quoteCredit } from "@/server/credit/schedule";
import { creditPosition } from "@/server/services/scoring";
import {
  AVAILABLE_TERMS,
  MAX_INCOME_COMMITMENT,
  MIN_AMOUNT_CENTS,
} from "@/server/credit/rates";
import { creditApplicationSchema, parseBrlToCents } from "@/server/validation";
import { db } from "@/server/db";
import type { ActionState } from "./auth";

export async function applyForCreditAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireActiveCustomer();
  const parsed = creditApplicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  let amountCents: number;
  try {
    amountCents = parseBrlToCents(parsed.data.amount);
  } catch {
    return { error: "Valor inválido." };
  }
  if (amountCents < MIN_AMOUNT_CENTS) {
    return { error: `O valor mínimo é de R$ ${(MIN_AMOUNT_CENTS / 100).toFixed(2)}.` };
  }

  const result = await apply({
    userId: user.id,
    amountCents,
    termMonths: parsed.data.termMonths,
    purpose: parsed.data.purpose,
    ip: await clientIp(),
  });

  revalidatePath("/app");
  revalidatePath("/app/contratos");
  redirect(`/app/propostas/${result.applicationId}`);
}

/**
 * Aceite do contrato.
 *
 * A "assinatura" registra um hash do contrato com identificador do cliente e
 * horário. Assinatura eletrônica com validade jurídica plena exige provedor
 * certificado (ICP-Brasil ou equivalente aceito) — este é o ponto de encaixe.
 */
export async function signContractAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireActiveCustomer();
  const contractId = String(formData.get("contractId") ?? "");
  const accepted = formData.get("accept") === "on";

  if (!accepted) return { error: "É necessário aceitar as condições do contrato." };

  const contract = await db.contract.findUnique({ where: { id: contractId } });
  if (!contract || contract.userId !== user.id) return { error: "Contrato não encontrado." };

  const ip = await clientIp();
  const signature = createHash("sha256")
    .update(`${contract.id}|${user.id}|${user.cpf}|${new Date().toISOString()}|${ip ?? ""}`)
    .digest("hex");

  try {
    await signAndDisburse({
      contractId,
      userId: user.id,
      signatureHash: signature,
      ip,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível assinar." };
  }

  revalidatePath("/app");
  redirect(`/app/contratos/${contractId}?assinado=1`);
}

export async function cancelApplicationAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("applicationId") ?? "");
  await db.creditApplication.updateMany({
    where: { id, userId: user.id, status: { in: ["UNDER_REVIEW", "APPROVED"] } },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/app/contratos");
}


export type SimulacaoParcela = {
  numero: number;
  vencimento: string;
  amortizacaoCents: number;
  jurosCents: number;
  totalCents: number;
};

export type Simulacao = {
  solicitadoCents: number;
  prazo: number;
  parcelaCents: number;
  totalCents: number;
  jurosCents: number;
  iofCents: number;
  taxaMensalBps: number;
  cetAnualBps: number;
  primeiroVencimento: string;
  /** Fatia da renda declarada comprometida pela parcela, de 0 a 1. */
  comprometimento: number;
  comprometimentoMaximo: number;
  limiteDisponivelCents: number;
  rendaCents: number;
  /** Parcela de cada prazo disponível, para comparar o custo do tempo. */
  porPrazo: { prazo: number; parcelaCents: number; totalCents: number }[];
  parcelas: SimulacaoParcela[];
  /** Impedimentos que já dá para ver antes de solicitar. */
  avisos: string[];
};

/**
 * Simulação sob demanda para o simulador ao vivo.
 *
 * Roda no servidor porque é lá que mora a matemática do contrato: uma segunda
 * implementação no navegador acabaria divergindo da que gera o cronograma real,
 * e preço divergente entre o que se promete e o que se assina é problema sério
 * em crédito.
 */
export async function simulateAction(params: {
  amountCents: number;
  termMonths: number;
}): Promise<Simulacao> {
  const user = await requireUser();
  const [posicao, kyc] = await Promise.all([
    creditPosition(user.id),
    db.kycProfile.findUnique({ where: { userId: user.id } }),
  ]);

  const teto = Math.max(posicao.limit.availableCents, MIN_AMOUNT_CENTS);
  const solicitado = Math.min(Math.max(params.amountCents, MIN_AMOUNT_CENTS), teto);
  const prazo = AVAILABLE_TERMS.includes(params.termMonths as (typeof AVAILABLE_TERMS)[number])
    ? params.termMonths
    : 12;

  const taxa = posicao.limit.monthlyRateBps;
  const cotacao = quoteCredit({ requestedCents: solicitado, termMonths: prazo, monthlyRateBps: taxa });

  const renda = kyc?.monthlyIncomeCents ?? 0;
  const comprometimento = renda > 0 ? cotacao.installmentCents / renda : 0;

  const avisos: string[] = [];
  if (params.amountCents > teto) {
    avisos.push(
      `Ajustamos para ${(teto / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}, seu limite disponível hoje.`,
    );
  }
  if (comprometimento > MAX_INCOME_COMMITMENT) {
    avisos.push(
      `Esta parcela usa ${Math.round(comprometimento * 100)}% da sua renda declarada. A política permite até ${Math.round(MAX_INCOME_COMMITMENT * 100)}% — escolha um prazo maior ou um valor menor.`,
    );
  }

  const formatarData = (data: Date) => data.toLocaleDateString("pt-BR");

  return {
    solicitadoCents: solicitado,
    prazo,
    parcelaCents: cotacao.installmentCents,
    totalCents: cotacao.totalPayableCents,
    jurosCents: cotacao.totalInterestCents,
    iofCents: cotacao.iofCents,
    taxaMensalBps: taxa,
    cetAnualBps: cotacao.cetYearlyBps,
    primeiroVencimento: formatarData(cotacao.firstDueDate),
    comprometimento,
    comprometimentoMaximo: MAX_INCOME_COMMITMENT,
    limiteDisponivelCents: posicao.limit.availableCents,
    rendaCents: renda,
    porPrazo: AVAILABLE_TERMS.map((meses) => {
      const alternativa = quoteCredit({
        requestedCents: solicitado,
        termMonths: meses,
        monthlyRateBps: taxa,
      });
      return {
        prazo: meses,
        parcelaCents: alternativa.installmentCents,
        totalCents: alternativa.totalPayableCents,
      };
    }),
    parcelas: cotacao.installments.map((parcela) => ({
      numero: parcela.number,
      vencimento: formatarData(parcela.dueDate),
      amortizacaoCents: parcela.principalCents,
      jurosCents: parcela.interestCents,
      totalCents: parcela.totalCents,
    })),
    avisos,
  };
}
