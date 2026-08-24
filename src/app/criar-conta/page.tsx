"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type ActionState } from "@/app/actions/auth";
import { AuthShell } from "@/components/app/AuthShell";
import { Alert, Field, SubmitButton } from "@/components/app/ui";

export default function SignUpPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(signUpAction, null);

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva dois minutos. A verificação de identidade vem logo depois."
      footer={
        <p className="text-gray-valor text-sm">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-lime hover:underline">
            Entrar
          </Link>
        </p>
      }
    >
      <form action={formAction} className="space-y-4">
        <Alert state={state} />
        <Field label="Nome completo" name="name" autoComplete="name" required />
        <Field label="E-mail" name="email" type="email" autoComplete="email" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CPF" name="cpf" inputMode="numeric" placeholder="000.000.000-00" required />
          <Field label="Celular" name="phone" inputMode="tel" placeholder="(11) 90000-0000" required />
        </div>
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="Mínimo de 10 caracteres, com maiúscula, minúscula e número."
        />
        <SubmitButton className="w-full" pendingLabel="Criando…">
          Criar conta
        </SubmitButton>
        <p className="text-gray-valor text-[0.6875rem] leading-relaxed">
          Ao criar a conta você concorda com os termos de uso e com o tratamento dos seus dados
          conforme a política de privacidade.
        </p>
      </form>
    </AuthShell>
  );
}
