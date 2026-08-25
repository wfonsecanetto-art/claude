"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import type { ActionState } from "@/app/actions/auth";
import {
  addReferenceAction,
  removeReferenceAction,
  saveKycAction,
  submitKycAction,
  uploadDocumentAction,
} from "@/app/actions/onboarding";
import { Alert, Field, SubmitButton } from "@/components/app/ui";

export function KycForm({ defaults }: { defaults: Record<string, string> }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveKycAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data de nascimento" name="birthDate" type="date" defaultValue={defaults.birthDate} required />
        <Field label="Nome da mãe" name="motherName" defaultValue={defaults.motherName} required />
        <Field label="Ocupação" name="occupation" defaultValue={defaults.occupation} required />
        <Field
          label="Renda mensal"
          name="monthlyIncome"
          inputMode="decimal"
          placeholder="3.500,00"
          defaultValue={defaults.monthlyIncome}
          hint="Usada para calcular o comprometimento máximo da parcela."
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="CEP" name="zipCode" inputMode="numeric" defaultValue={defaults.zipCode} required />
        <Field label="Rua" name="street" defaultValue={defaults.street} required />
        <Field label="Número" name="number" defaultValue={defaults.number} required />
        <Field label="Complemento" name="complement" defaultValue={defaults.complement} />
        <Field label="Bairro" name="district" defaultValue={defaults.district} required />
        <Field label="Cidade" name="city" defaultValue={defaults.city} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Estado" name="state" maxLength={2} placeholder="SP" defaultValue={defaults.state} required />
      </div>

      <SubmitButton pendingLabel="Salvando…">Salvar dados</SubmitButton>
    </form>
  );
}

export function DocumentUpload({
  type,
  label,
  current,
  locked,
  optional,
}: {
  type: string;
  label: string;
  current: { fileName: string; status: string } | null;
  locked: boolean;
  optional?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(uploadDocumentAction, null);

  return (
    <div className="inset-box">
      <p className="text-sm font-semibold text-white">
        {label}
        {optional ? <span className="text-muted font-normal"> (opcional)</span> : null}
      </p>

      {current ? (
        <p className="text-micro mt-1.5 truncate">
          Enviado: {current.fileName}
        </p>
      ) : (
        <p className="text-micro mt-1.5">JPG, PNG, WEBP ou PDF até 8 MB.</p>
      )}

      {!locked ? (
        <form action={formAction} className="mt-3 space-y-2">
          <input type="hidden" name="type" value={type} />
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            aria-label={`Arquivo para ${label}`}
            className="field-file"
          />
          <SubmitButton variant="outline" size="sm" pendingLabel="Enviando…">
            {current ? "Substituir" : "Enviar"}
          </SubmitButton>
          <Alert state={state} />
        </form>
      ) : null}
    </div>
  );
}

export function ReferenceForm({
  references,
  locked,
}: {
  references: { id: string; name: string; phone: string; relationship: string }[];
  locked: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(addReferenceAction, null);

  return (
    <div className="space-y-5">
      {references.length > 0 ? (
        <ul className="space-y-2">
          {references.map((reference) => (
            <li
              key={reference.id}
              className="inset-box flex items-center justify-between gap-3 p-3"
            >
              <div>
                <p className="text-sm text-white">{reference.name}</p>
                <p className="text-micro">
                  {reference.relationship} · {reference.phone}
                </p>
              </div>
              {!locked ? (
                <form action={removeReferenceAction}>
                  <input type="hidden" name="id" value={reference.id} />
                  <button
                    type="submit"
                    aria-label={`Remover referência ${reference.name}`}
                    className="text-muted transition-colors hover:text-red-300"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {!locked && references.length < 4 ? (
        <form action={formAction} className="space-y-4">
          <Alert state={state} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nome" name="name" required />
            <Field label="Telefone" name="phone" inputMode="tel" required />
            <Field label="Vínculo" name="relationship" placeholder="Irmã, colega…" required />
          </div>
          <SubmitButton variant="outline" pendingLabel="Adicionando…">
            Adicionar referência
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}

export function SubmitKycForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(submitKycAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <p className="text-muted text-sm">
        Tudo preenchido. Ao enviar, seus dados vão para análise e não poderão ser alterados até a
        conclusão.
      </p>
      <SubmitButton pendingLabel="Enviando…">Enviar para análise</SubmitButton>
    </form>
  );
}
