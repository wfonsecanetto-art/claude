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
    <div className="min-h-svh">
      <header className="border-hairline bg-graphite/60 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="container-valor flex h-16 items-center justify-between gap-4">
          <Link href="/app" aria-label="Conta Valor — início">
            <Logo />
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="eyebrow text-[0.5625rem]">Saldo na Conta Valor</p>
              <p className="font-display text-sm font-extrabold text-white tabular-nums">
                {formatBRL(balance)}
              </p>
            </div>
            <div className="border-hairline hidden border-l pl-4 text-right md:block">
              <p className="text-xs font-semibold text-white">{user.name.split(" ")[0]}</p>
              <p className="text-gray-valor text-[0.6875rem]">{maskCpf(user.cpf)}</p>
            </div>
            <form action={signOutAction}>
              <SubmitButton variant="outline" className="px-4 py-2 text-xs" pendingLabel="Saindo…">
                Sair
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <div className="container-valor grid gap-8 py-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AppNav />
          {user.role !== "CUSTOMER" ? (
            <Link
              href="/backoffice"
              className="border-hairline text-gray-valor hover:border-lime/40 hover:text-lime mt-4 flex items-center justify-center rounded-xl border px-3 py-2.5 text-xs transition-colors"
            >
              Ir para o backoffice
            </Link>
          ) : null}
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
