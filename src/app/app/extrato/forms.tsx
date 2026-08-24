"use client";

import { useActionState } from "react";
import { depositAction } from "@/app/actions/wallet";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Field, SubmitButton } from "@/components/app/ui";

export function DepositForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(depositAction, null);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-[minmax(0,240px)_auto] sm:items-end">
      <div className="sm:col-span-2">
        <Alert state={state} />
      </div>
      <Field label="Valor" name="amount" inputMode="decimal" placeholder="500,00" required />
      <SubmitButton pendingLabel="Processando…">Depositar</SubmitButton>
    </form>
  );
}
