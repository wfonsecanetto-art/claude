import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-x-clip px-5 py-16">
      <div
        aria-hidden="true"
        className="bg-lime/[0.06] pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
      />

      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 inline-flex" aria-label="Voltar ao site do Banco Valor Digital">
          <Logo />
        </Link>

        <h1 className="page-title text-3xl">{title}</h1>
        <p className="text-muted mt-3 text-sm">{subtitle}</p>

        <div className="mt-8">{children}</div>

        {footer ? <div className="mt-8">{footer}</div> : null}
      </div>
    </main>
  );
}
