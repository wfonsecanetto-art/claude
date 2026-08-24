import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { documentPath } from "@/server/services/onboarding";

/**
 * Entrega de documento privado.
 *
 * Arquivos de KYC não ficam em /public: só saem por aqui, e só para o próprio
 * cliente ou para quem analisa. A resposta nunca é cacheada.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !user.fullyAuthenticated) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { id } = await context.params;
  const document = await db.document.findUnique({ where: { id } });
  if (!document) return new NextResponse("Não encontrado", { status: 404 });

  const isOwner = document.userId === user.id;
  const isReviewer = user.role === "ANALYST" || user.role === "ADMIN";
  if (!isOwner && !isReviewer) return new NextResponse("Não autorizado", { status: 403 });

  try {
    const file = await readFile(documentPath(document.storageKey));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.fileName)}"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch {
    return new NextResponse("Arquivo indisponível", { status: 404 });
  }
}
