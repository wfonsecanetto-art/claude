import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./session";

/**
 * Portões de acesso usados por páginas e server actions.
 *
 * Autorização mora no servidor. O middleware apenas evita renderizar rotas
 * privadas para quem não tem cookie; quem decide de fato é sempre isto aqui.
 */

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (!user.fullyAuthenticated) redirect("/entrar/verificacao");
  return user;
}

export async function requireRole(...roles: string[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/app");
  return user;
}

export async function requireActiveCustomer(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.status === "PENDING_KYC") redirect("/app/verificacao");
  return user;
}
