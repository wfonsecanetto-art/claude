"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { writeAudit } from "@/server/audit";
import { requireUser } from "@/server/auth/guards";
import { checkPasswordStrength, hashPassword, verifyPassword } from "@/server/auth/password";
import { generateMfaSecret, verifyMfaToken } from "@/server/auth/mfa";
import { clientIp, revokeAllSessions } from "@/server/auth/session";
import type { ActionState } from "./auth";

/** Gera e guarda um segredo TOTP ainda não ativado. */
export async function startMfaSetupAction(): Promise<void> {
  const user = await requireUser();
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (record.mfaEnabledAt) return;

  await db.user.update({
    where: { id: user.id },
    data: { mfaSecret: generateMfaSecret() },
  });
  revalidatePath("/app/perfil");
}

export async function confirmMfaAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "");
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  if (!record.mfaSecret) return { error: "Comece a configuração novamente." };
  if (!(await verifyMfaToken(token, record.mfaSecret))) {
    return { error: "Código inválido. Tente o próximo." };
  }

  await db.user.update({ where: { id: user.id }, data: { mfaEnabledAt: new Date() } });
  await db.session.update({ where: { id: user.sessionId }, data: { mfaPassed: true } });
  await writeAudit({
    actorId: user.id,
    action: "security.mfa_enabled",
    entity: "User",
    entityId: user.id,
    ip: await clientIp(),
  });

  revalidatePath("/app/perfil");
  return { ok: "Segundo fator ativado." };
}

export async function disableMfaAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const password = String(formData.get("password") ?? "");
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  // Desativar o segundo fator é operação sensível: exige a senha novamente.
  if (!(await verifyPassword(password, record.passwordHash))) {
    return { error: "Senha incorreta." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { mfaSecret: null, mfaEnabledAt: null },
  });
  await writeAudit({
    actorId: user.id,
    action: "security.mfa_disabled",
    entity: "User",
    entityId: user.id,
    ip: await clientIp(),
  });

  revalidatePath("/app/perfil");
  return { ok: "Segundo fator desativado." };
}

export async function changePasswordAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");

  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(current, record.passwordHash))) {
    return { error: "Senha atual incorreta." };
  }

  const strength = checkPasswordStrength(next);
  if (!strength.valid) return { error: strength.problems.join(" ") };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  // Trocar a senha derruba as outras sessões: se houve comprometimento,
  // a sessão do invasor morre junto.
  await revokeAllSessions(user.id, user.sessionId);
  await writeAudit({
    actorId: user.id,
    action: "security.password_changed",
    entity: "User",
    entityId: user.id,
    ip: await clientIp(),
  });

  revalidatePath("/app/perfil");
  return { ok: "Senha alterada. As demais sessões foram encerradas." };
}

export async function revokeSessionsAction(): Promise<void> {
  const user = await requireUser();
  await revokeAllSessions(user.id, user.sessionId);
  await writeAudit({
    actorId: user.id,
    action: "security.sessions_revoked",
    entity: "User",
    entityId: user.id,
  });
  revalidatePath("/app/perfil");
}
