"use client";

import { useActionState } from "react";
import { verifyMfaAction, type ActionState } from "@/app/actions/auth";
import { AuthShell } from "@/components/app/AuthShell";
import { Alert, Field, SubmitButton } from "@/components/app/ui";

export default function MfaPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(verifyMfaAction, null);

  return (
    <AuthShell
      title="Verificação"
      subtitle="Digite o código de seis dígitos gerado pelo seu aplicativo autenticador."
    >
      <form action={formAction} className="space-y-4">
        <Alert state={state} />
        <Field
          label="Código"
          name="token"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="000000"
          required
        />
        <SubmitButton block pendingLabel="Verificando…">
          Verificar
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
