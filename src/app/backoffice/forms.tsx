"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions/auth";
import { reviewApplicationAction, reviewKycAction } from "@/app/actions/backoffice";
import { Alert, SubmitButton } from "@/components/app/ui";

const textareaClass =
  "w-full rounded-xl border border-hairline bg-ink/70 px-4 py-3 text-sm text-white placeholder:text-gray-valor/60 focus:border-lime/60 focus:outline-none";

export function KycDecisionForm({ userId }: { userId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(reviewKycAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <Alert state={state} />
      <input type="hidden" name="userId" value={userId} />
      <textarea
        name="reason"
        rows={2}
        placeholder="Motivo (obrigatório em caso de recusa)"
        aria-label="Motivo da decisão"
        className={textareaClass}
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
      <textarea
        name="reason"
        rows={2}
        placeholder="Justificativa da decisão (obrigatória)"
        aria-label="Justificativa da decisão"
        required
        className={textareaClass}
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
