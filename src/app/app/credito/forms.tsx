"use client";

import { useActionState, useState } from "react";
import { applyForCreditAction } from "@/app/actions/credit";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Field, SelectField, SubmitButton } from "@/components/app/ui";

/**
 * O simulador navega por GET: mudar valor ou prazo recarrega a página com a
 * nova simulação calculada no servidor.
 */
export function SimulatorForm({
  defaultAmount,
  defaultTerm,
  maxAmount,
  terms,
}: {
  defaultAmount: string;
  defaultTerm: number;
  maxAmount: number;
  terms: number[];
}) {
  const [amount, setAmount] = useState(defaultAmount);

  return (
    <form method="get" className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
      <div>
        <label htmlFor="valor" className="eyebrow mb-2 block text-[0.625rem]">
          Quanto você precisa
        </label>
        <input
          id="valor"
          name="valor"
          type="number"
          min={300}
          max={Math.floor(maxAmount)}
          step={50}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="border-hairline bg-ink/70 focus:border-lime/60 w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none"
        />
        <input
          type="range"
          min={300}
          max={Math.max(Math.floor(maxAmount), 300)}
          step={50}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-label="Ajustar valor"
          className="accent-lime mt-3 w-full"
        />
      </div>

      <SelectField
        label="Prazo"
        name="prazo"
        defaultValue={String(defaultTerm)}
        options={terms.map((term) => ({ value: String(term), label: `${term} meses` }))}
      />

      <SubmitButton variant="outline" pendingLabel="Calculando…">
        Simular
      </SubmitButton>
    </form>
  );
}

export function ApplyForm({ amount, term }: { amount: string; term: number }) {
  const [state, formAction] = useActionState<ActionState, FormData>(applyForCreditAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="termMonths" value={term} />
      <Field
        label="Finalidade do crédito"
        name="purpose"
        placeholder="Capital de giro, reforma, emergência…"
        required
      />
      <SubmitButton pendingLabel="Analisando…">Solicitar crédito</SubmitButton>
    </form>
  );
}
