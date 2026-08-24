"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveCustomer, requireUser } from "@/server/auth/guards";
import { clientIp } from "@/server/auth/session";
import { apply, signAndDisburse } from "@/server/services/credit";
import { MIN_AMOUNT_CENTS } from "@/server/credit/rates";
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
