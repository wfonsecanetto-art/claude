import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

/**
 * Raiz do piloto.
 *
 * Não existe site institucional: o produto é o aplicativo. Quem chega com
 * sessão válida vai direto para a conta; quem não tem, vai para o acesso.
 */
export default async function Root() {
  const user = await getCurrentUser();
  redirect(user?.fullyAuthenticated ? "/app" : "/entrar");
}
