"use server";

import { revalidatePath } from "next/cache";
import { requireActiveCustomer } from "@/server/auth/guards";
import { clientIp } from "@/server/auth/session";
import { depositToWallet, payInstallment, transfer } from "@/server/services/payments";
import { parseBrlToCents, transferSchema } from "@/server/validation";
import type { ActionState } from "./auth";

export async function payInstallmentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireActiveCustomer();
  const installmentId = String(formData.get("installmentId") ?? "");
  const method = String(formData.get("method") ?? "WALLET_BALANCE");

  try {
    const result = await payInstallment({
      userId: user.id,
      installmentId,
      method: method as "WALLET_BALANCE" | "PIX" | "BOLETO",
      ip: await clientIp(),
    });
    revalidatePath("/app");
    revalidatePath("/app/contratos");
    revalidatePath("/app/extrato");
    return { ok: `Parcela quitada. Referência ${result.reference}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível pagar." };
  }
}

export async function depositAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireActiveCustomer();
  let amountCents: number;
  try {
    amountCents = parseBrlToCents(String(formData.get("amount") ?? ""));
  } catch {
    return { error: "Valor inválido." };
  }
  if (amountCents <= 0) return { error: "Informe um valor positivo." };
  if (amountCents > 5_000_000) return { error: "Valor máximo por depósito: R$ 50.000,00." };

  try {
    const charge = await depositToWallet({ userId: user.id, amountCents, ip: await clientIp() });
    revalidatePath("/app");
    revalidatePath("/app/extrato");
    return { ok: `Depósito confirmado (${charge.provider} · ${charge.reference}).` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível depositar." };
  }
}

export async function transferAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireActiveCustomer();
  const parsed = transferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  let amountCents: number;
  try {
    amountCents = parseBrlToCents(parsed.data.amount);
  } catch {
    return { error: "Valor inválido." };
  }

  try {
    const result = await transfer({
      fromUserId: user.id,
      toEmailOrCpf: parsed.data.recipient,
      amountCents,
      description: parsed.data.description,
      ip: await clientIp(),
    });
    revalidatePath("/app");
    revalidatePath("/app/extrato");
    return { ok: `Transferência enviada para ${result.recipientName}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível transferir." };
  }
}
