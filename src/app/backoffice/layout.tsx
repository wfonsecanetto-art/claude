import Link from "next/link";
import type { ReactNode } from "react";
import { requireRole } from "@/server/auth/guards";
import { signOutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/app/ui";
import { Logo } from "@/components/ui/Logo";

export default async function BackofficeLayout({ children }: { children: ReactNode }) {
  const analyst = await requireRole("ANALYST", "ADMIN");

  return (
    <div className="min-h-svh">
      <header className="border-hairline bg-graphite/60 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="container-valor flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="border-lime/30 bg-lime/10 text-lime rounded-full border px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.16em] uppercase">
              Backoffice
            </span>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-gray-valor hidden text-xs sm:block">
              {analyst.name} · {analyst.role === "ADMIN" ? "Administrador" : "Analista"}
            </p>
            <Link href="/app" className="text-gray-valor hover:text-lime text-xs">
              Minha conta
            </Link>
            <form action={signOutAction}>
              <SubmitButton variant="outline" className="px-4 py-2 text-xs" pendingLabel="Saindo…">
                Sair
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <main className="container-valor py-10">{children}</main>
    </div>
  );
}
