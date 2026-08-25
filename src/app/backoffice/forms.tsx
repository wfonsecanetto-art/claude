"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions/auth";
import { reviewApplicationAction, reviewKycAction } from "@/app/actions/backoffice";
import { Alert, SubmitButton, Textarea } from "@/components/app/ui";

export function KycDecisionForm({ userId }: { userId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(reviewKycAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <Alert state={state} />
      <input type="hidden" name="userId" value={userId} />
      <Textarea
        name="reason"
        label="Motivo da decisão"
        placeholder="Motivo (obrigatório em caso de recusa)"
      />
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="decision" value="approve" pendingLabel="Aprovando…">
          Aprovar cadastro
        </SubmitButton>
        <SubmitButton name="decision" value="reject" variant="danger" pendingLabel="Recusando…">
          Recusar
        </SubmitButton>
      </div>
    </form>
  );
}

export function ApplicationDecisionForm({ applicationId }: { applicationId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(reviewApplicationAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <Alert state={state} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <Textarea
        name="reason"
        label="Justificativa da decisão"
        placeholder="Justificativa da decisão (obrigatória)"
        required
      />
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="decision" value="approve" pendingLabel="Aprovando…">
          Aprovar proposta
        </SubmitButton>
        <SubmitButton name="decision" value="reject" variant="danger" pendingLabel="Recusando…">
          Recusar
        </SubmitButton>
      </div>
    </form>
  );
}
