"use client";

import { useActionState } from "react";
import { signContractAction } from "@/app/actions/credit";
import { payInstallmentAction } from "@/app/actions/wallet";
import type { ActionState } from "@/app/actions/auth";
import { Alert, SubmitButton } from "@/components/app/ui";

export function SignContractForm({ contractId }: { contractId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(signContractAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <input type="hidden" name="contractId" value={contractId} />
      <label className="flex items-start gap-3 text-sm text-white">
        <input type="checkbox" name="accept" className="accent-lime mt-0.5" required />
        <span>
          Li e aceito as condições, incluindo taxa de juros, IOF, prazo e Custo Efetivo Total.
        </span>
      </label>
      <SubmitButton pendingLabel="Assinando…">Assinar e receber</SubmitButton>
    </form>
  );
}

export function PayInstallmentForm({
  installmentId,
  amountCents,
  balanceCents,
}: {
  installmentId: string;
  amountCents: number;
  balanceCents: number;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(payInstallmentAction, null);
  const hasBalance = balanceCents >= amountCents;

  return (
    <form action={formAction} className="space-y-3">
      <Alert state={state} />
      <input type="hidden" name="installmentId" value={installmentId} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="method" value="WALLET_BALANCE" pendingLabel="Pagando…">
          {hasBalance ? "Pagar com saldo" : "Saldo insuficiente"}
        </SubmitButton>
        <SubmitButton name="method" value="PIX" variant="outline" pendingLabel="Gerando…">
          Pagar com Pix
        </SubmitButton>
        <SubmitButton name="method" value="BOLETO" variant="outline" pendingLabel="Gerando…">
          Boleto
        </SubmitButton>
      </div>
    </form>
  );
}
