"use client";

import { useActionState } from "react";
import { transferAction } from "@/app/actions/wallet";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Field, SubmitButton } from "@/components/app/ui";

export function TransferForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(transferAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Destinatário" name="recipient" placeholder="e-mail ou CPF" required />
        <Field label="Valor" name="amount" inputMode="decimal" placeholder="100,00" required />
      </div>
      <Field label="Descrição" name="description" placeholder="Opcional" />
      <SubmitButton pendingLabel="Enviando…">Transferir</SubmitButton>
    </form>
  );
}
