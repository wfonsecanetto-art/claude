import Link from "next/link";
import type { ReactNode } from "react";
import { requireRole } from "@/server/auth/guards";
import { signOutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/app/ui";
import { Logo } from "@/components/ui/Logo";

export default async function BackofficeLayout({ children }: { children: ReactNode }) {
  const analyst = await requireRole("ANALYST", "ADMIN");

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="container-valor app-topbar-inner">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="badge-lime">Backoffice</span>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-micro hidden sm:block">
              {analyst.name} · {analyst.role === "ADMIN" ? "Administrador" : "Analista"}
            </p>
            <Link href="/app" className="text-micro link-lime">
              Minha conta
            </Link>
            <form action={signOutAction}>
              <SubmitButton variant="outline" size="sm" pendingLabel="Saindo…">
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
