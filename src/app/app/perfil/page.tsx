import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { buildOtpAuthUrl, renderQrCodeDataUrl } from "@/server/auth/mfa";
import { formatCpf, formatPhone } from "@/server/validation";
import { Panel } from "@/components/app/ui";
import {
  ChangePasswordForm,
  DisableMfaForm,
  EnableMfaForm,
  RevokeSessionsForm,
  StartMfaForm,
} from "./forms";

export default async function ProfilePage() {
  const user = await requireUser();
  const [record, sessions, recentAudit] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.id } }),
    db.session.count({ where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } } }),
    db.auditLog.findMany({
      where: { actorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const mfaEnabled = Boolean(record.mfaEnabledAt);
  const pendingSecret = !mfaEnabled && record.mfaSecret ? record.mfaSecret : null;
  const qrCode = pendingSecret
    ? await renderQrCodeDataUrl(buildOtpAuthUrl(record.email, pendingSecret))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Segurança</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
          Sua conta
        </h1>
      </div>

      <Panel title="Dados de acesso">
        <dl className="grid gap-4 sm:grid-cols-2">
          {[
            ["Nome", record.name],
            ["E-mail", record.email],
            ["CPF", formatCpf(record.cpf)],
            ["Celular", formatPhone(record.phone)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow text-[0.5625rem]">{label}</dt>
              <dd className="mt-1.5 text-sm text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel
        title="Verificação em duas etapas"
        description="Código temporário gerado por aplicativo autenticador. Não usamos SMS — é vetor conhecido de fraude."
      >
        {mfaEnabled ? (
          <div className="space-y-4">
            <p className="border-lime/30 bg-lime/10 text-lime rounded-xl border px-4 py-3 text-sm">
              Ativa desde {record.mfaEnabledAt?.toLocaleDateString("pt-BR")}.
            </p>
            <DisableMfaForm />
          </div>
        ) : pendingSecret && qrCode ? (
          <div className="space-y-5">
            <div className="flex flex-col items-start gap-5 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="QR Code para configurar a verificação em duas etapas"
                width={200}
                height={200}
                className="rounded-xl"
              />
              <div>
                <p className="text-gray-valor text-sm leading-relaxed">
                  Escaneie o código no seu aplicativo autenticador ou informe a chave manualmente:
                </p>
                <code className="border-hairline bg-ink/70 mt-3 block rounded-lg border px-3 py-2 text-xs break-all text-white">
                  {pendingSecret}
                </code>
              </div>
            </div>
            <EnableMfaForm />
          </div>
        ) : (
          <StartMfaForm />
        )}
      </Panel>

      <Panel title="Senha">
        <ChangePasswordForm />
      </Panel>

      <Panel
        title="Sessões ativas"
        description={`${sessions} ${sessions === 1 ? "sessão ativa" : "sessões ativas"}, incluindo esta.`}
      >
        <RevokeSessionsForm />
      </Panel>

      <Panel title="Atividade recente" description="Registro de eventos da sua conta.">
        <ul className="divide-hairline divide-y">
          {recentAudit.map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-4 py-2.5">
              <p className="text-sm text-white">{log.action}</p>
              <p className="text-gray-valor text-[0.6875rem] tabular-nums">
                {log.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
