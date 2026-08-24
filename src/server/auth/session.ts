import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "../db";

/**
 * Sessão assinada em cookie httpOnly, com registro em banco.
 *
 * O JWT carrega apenas o identificador da sessão; papel, status e segundo fator
 * são lidos do banco a cada requisição. Assim, bloquear um usuário ou revogar
 * uma sessão tem efeito imediato, sem esperar o token expirar.
 */

const COOKIE_NAME = "valor_session";
const SESSION_DAYS = 7;

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 24) {
    throw new Error(
      "AUTH_SECRET ausente ou curto demais. Defina 32 bytes aleatórios no .env.",
    );
  }
  return new TextEncoder().encode(value);
}

export async function createSession(userId: string, mfaPassed: boolean) {
  const headerList = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  const session = await db.session.create({
    data: {
      userId,
      mfaPassed,
      expiresAt,
      ip: headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: headerList.get("user-agent")?.slice(0, 255) ?? null,
    },
  });

  const token = await new SignJWT({ sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return session;
}

export async function markSessionMfaPassed(sessionId: string) {
  await db.session.update({ where: { id: sessionId }, data: { mfaPassed: true } });
}

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  cpf: string;
  role: string;
  status: string;
  mfaEnabled: boolean;
  sessionId: string;
  /** Falso quando o segundo fator ainda não foi apresentado nesta sessão. */
  fullyAuthenticated: boolean;
};

/**
 * Usuário da requisição atual.
 *
 * Memoizado com `cache` do React: vários componentes da mesma árvore pedem o
 * usuário e isso vira uma única consulta por requisição.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let sessionId: string;
  try {
    const { payload } = await jwtVerify(token, secret());
    sessionId = String(payload.sid);
  } catch {
    return null;
  }

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.user.status === "BLOCKED") return null;

  const mfaEnabled = Boolean(session.user.mfaEnabledAt);

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    cpf: session.user.cpf,
    role: session.user.role,
    status: session.user.status,
    mfaEnabled,
    sessionId: session.id,
    fullyAuthenticated: !mfaEnabled || session.mfaPassed,
  };
});

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      await db.session.update({
        where: { id: String(payload.sid) },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Token inválido: basta limpar o cookie.
    }
  }

  cookieStore.delete(COOKIE_NAME);
}

export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  await db.session.updateMany({
    where: { userId, revokedAt: null, id: exceptSessionId ? { not: exceptSessionId } : undefined },
    data: { revokedAt: new Date() },
  });
}

export async function clientIp(): Promise<string | null> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
