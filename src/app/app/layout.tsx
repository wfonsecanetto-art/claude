import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/server/auth/guards";
import { walletBalance } from "@/server/ledger";
import { formatBRL } from "@/server/money";
import { maskCpf } from "@/server/validation";
import { signOutAction } from "@/app/actions/auth";
import { AppNav } from "@/components/app/AppNav";
import { SubmitButton } from "@/components/app/ui";
import { Logo } from "@/components/ui/Logo";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const balance = await walletBalance(user.id);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="container-valor app-topbar-inner">
          <Link href="/app" aria-label="Conta Valor — início">
            <Logo />
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="tile-label">Saldo na Conta Valor</p>
              <p className="font-display num text-sm font-extrabold text-white">
                {formatBRL(balance)}
              </p>
            </div>
            <div className="hidden border-l border-hairline pl-4 text-right md:block">
              <p className="text-xs font-semibold text-white">{user.name.split(" ")[0]}</p>
              <p className="text-micro">{maskCpf(user.cpf)}</p>
            </div>
            <form action={signOutAction}>
              <SubmitButton variant="outline" size="sm" pendingLabel="Saindo…">
                Sair
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <div className="container-valor app-body">
        <aside className="app-sidebar">
          <AppNav />
          {user.role !== "CUSTOMER" ? (
            <Link href="/backoffice" className="doc-chip mt-4 w-full justify-center py-2.5">
              Ir para o backoffice
            </Link>
          ) : null}
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
