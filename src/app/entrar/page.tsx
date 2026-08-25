"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type ActionState } from "@/app/actions/auth";
import { AuthShell } from "@/components/app/AuthShell";
import { Alert, Field, SubmitButton } from "@/components/app/ui";

export default function SignInPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(signInAction, null);

  return (
    <AuthShell
      title="Entrar"
      subtitle="Acesse sua Conta Valor para acompanhar limite, contratos e pagamentos."
      footer={
        <p className="text-muted text-sm">
          Ainda não tem conta?{" "}
          <Link href="/criar-conta" className="link-lime">
            Criar conta
          </Link>
        </p>
      }
    >
      <form action={formAction} className="space-y-4">
        <Alert state={state} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" required />
        <Field label="Senha" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton block pendingLabel="Entrando…">
          Entrar
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
