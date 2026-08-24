"use server";

import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { writeAudit } from "@/server/audit";
import { checkPasswordStrength, hashPassword, verifyPassword } from "@/server/auth/password";
import { verifyMfaToken } from "@/server/auth/mfa";
import {
  clientIp,
  createSession,
  destroySession,
  getCurrentUser,
  markSessionMfaPassed,
} from "@/server/auth/session";
import { getWalletAccount } from "@/server/ledger";
import { rateLimit } from "@/server/ratelimit";
import { recalculateScore } from "@/server/services/scoring";
import { signInSchema, signUpSchema } from "@/server/validation";

export type ActionState = { error?: string; ok?: string } | null;

export async function signUpAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const strength = checkPasswordStrength(parsed.data.password);
  if (!strength.valid) return { error: strength.problems.join(" ") };

  const ip = await clientIp();
  const limit = rateLimit(`signup:${ip ?? "anon"}`, 5, 3600);
  if (!limit.allowed) {
    return { error: "Muitas tentativas. Tente novamente mais tarde." };
  }

  const existing = await db.user.findFirst({
    where: { OR: [{ email: parsed.data.email }, { cpf: parsed.data.cpf }] },
  });
  if (existing) {
    return { error: "Já existe uma conta com este e-mail ou CPF." };
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      cpf: parsed.data.cpf,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  await getWalletAccount(user.id);
  await recalculateScore(user.id, "Conta criada");
  await createSession(user.id, true);
  await writeAudit({ actorId: user.id, action: "auth.signup", entity: "User", entityId: user.id, ip });

  redirect("/app/verificacao");
}

export async function signInAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Informe e-mail e senha." };

  const ip = await clientIp();
  const limit = rateLimit(`signin:${parsed.data.email}`, 8, 900);
  if (!limit.allowed) {
    return { error: `Muitas tentativas. Aguarde ${limit.retryAfterSeconds}s.` };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Mensagem única para e-mail inexistente e senha errada: não confirma
  // a existência da conta para quem está sondando.
  const genericError = { error: "E-mail ou senha incorretos." };
  if (!user) return genericError;

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    await writeAudit({ actorId: user.id, action: "auth.signin_failed", entity: "User", entityId: user.id, ip });
    return genericError;
  }

  if (user.status === "BLOCKED") {
    return { error: "Conta bloqueada. Fale com o atendimento." };
  }

  const mfaEnabled = Boolean(user.mfaEnabledAt);
  await createSession(user.id, !mfaEnabled);
  await writeAudit({ actorId: user.id, action: "auth.signin", entity: "User", entityId: user.id, ip });

  redirect(mfaEnabled ? "/entrar/verificacao" : user.role === "CUSTOMER" ? "/app" : "/backoffice");
}

export async function verifyMfaAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const token = String(formData.get("token") ?? "");
  const limit = rateLimit(`mfa:${user.id}`, 6, 300);
  if (!limit.allowed) return { error: "Muitas tentativas. Aguarde alguns minutos." };

  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!record.mfaSecret || !(await verifyMfaToken(token, record.mfaSecret))) {
    await writeAudit({ actorId: user.id, action: "auth.mfa_failed", entity: "User", entityId: user.id });
    return { error: "Código inválido." };
  }

  await markSessionMfaPassed(user.sessionId);
  await writeAudit({ actorId: user.id, action: "auth.mfa_passed", entity: "User", entityId: user.id });

  redirect(record.role === "CUSTOMER" ? "/app" : "/backoffice");
}

export async function signOutAction() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    await writeAudit({ actorId: user.id, action: "auth.signout", entity: "User", entityId: user.id });
  }
  redirect("/entrar");
}
