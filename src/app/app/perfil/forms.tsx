"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions/auth";
import {
  changePasswordAction,
  confirmMfaAction,
  disableMfaAction,
  revokeSessionsAction,
  startMfaSetupAction,
} from "@/app/actions/security";
import { Alert, Field, SubmitButton } from "@/components/app/ui";

export function StartMfaForm() {
  return (
    <form action={startMfaSetupAction} className="space-y-4">
      <p className="text-gray-valor text-sm leading-relaxed">
        Ative a verificação em duas etapas para exigir um código do seu aplicativo autenticador a
        cada acesso.
      </p>
      <SubmitButton pendingLabel="Gerando…">Ativar verificação</SubmitButton>
    </form>
  );
}

export function EnableMfaForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(confirmMfaAction, null);

  return (
    <form action={formAction} className="max-w-xs space-y-4">
      <Alert state={state} />
      <Field
        label="Código do aplicativo"
        name="token"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        required
      />
      <SubmitButton pendingLabel="Confirmando…">Confirmar</SubmitButton>
    </form>
  );
}

export function DisableMfaForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(disableMfaAction, null);

  return (
    <form action={formAction} className="max-w-xs space-y-4">
      <Alert state={state} />
      <Field label="Confirme sua senha" name="password" type="password" required />
      <SubmitButton variant="danger" pendingLabel="Desativando…">
        Desativar verificação
      </SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(changePasswordAction, null);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <Alert state={state} />
      <Field label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" required />
      <Field
        label="Nova senha"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint="Mínimo de 10 caracteres, com maiúscula, minúscula e número."
        required
      />
      <SubmitButton pendingLabel="Alterando…">Alterar senha</SubmitButton>
    </form>
  );
}

export function RevokeSessionsForm() {
  return (
    <form action={revokeSessionsAction}>
      <SubmitButton variant="outline" pendingLabel="Encerrando…">
        Encerrar as outras sessões
      </SubmitButton>
    </form>
  );
}
