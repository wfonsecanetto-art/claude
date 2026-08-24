"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth/guards";
import { clientIp } from "@/server/auth/session";
import { reviewApplication } from "@/server/services/credit";
import { reviewKyc } from "@/server/services/onboarding";
import type { ActionState } from "./auth";

export async function reviewKycAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const analyst = await requireRole("ANALYST", "ADMIN");
  const userId = String(formData.get("userId") ?? "");
  const approve = formData.get("decision") === "approve";
  const reason = String(formData.get("reason") ?? "").trim();

  if (!approve && reason.length < 5) {
    return { error: "Descreva o motivo da recusa." };
  }

  await reviewKyc({
    userId,
    analystId: analyst.id,
    approve,
    reason,
    ip: await clientIp(),
  });

  revalidatePath("/backoffice");
  return { ok: approve ? "Cadastro aprovado." : "Cadastro recusado." };
}

export async function reviewApplicationAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const analyst = await requireRole("ANALYST", "ADMIN");
  const applicationId = String(formData.get("applicationId") ?? "");
  const approve = formData.get("decision") === "approve";
  const reason = String(formData.get("reason") ?? "").trim();

  if (reason.length < 5) return { error: "Registre a justificativa da decisão." };

  try {
    await reviewApplication({
      applicationId,
      analystId: analyst.id,
      approve,
      reason,
      ip: await clientIp(),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível decidir." };
  }

  revalidatePath("/backoffice");
  return { ok: approve ? "Proposta aprovada." : "Proposta recusada." };
}
