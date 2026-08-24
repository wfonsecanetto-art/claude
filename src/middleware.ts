import { NextResponse, type NextRequest } from "next/server";

/**
 * Barreira de borda.
 *
 * Só verifica a presença do cookie de sessão — validar a assinatura aqui
 * exigiria o runtime de Node e tornaria toda navegação mais lenta. A
 * autorização real acontece nos guards do servidor, em cada página e action.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("valor_session");
  const { pathname } = request.nextUrl;

  const isPrivate = pathname.startsWith("/app") || pathname.startsWith("/backoffice");
  const isAuthPage = pathname === "/entrar" || pathname === "/criar-conta";

  if (isPrivate && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("proximo", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Cabeçalhos de segurança aplicados a toda resposta.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
