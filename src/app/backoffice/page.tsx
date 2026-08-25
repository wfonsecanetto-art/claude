import Link from "next/link";
import { requireRole } from "@/server/auth/guards";
import { db } from "@/server/db";
import { DOCUMENT_TYPES, type DocumentType } from "@/server/services/onboarding";
import { formatBRL, formatBps } from "@/server/money";
import { formatCpf } from "@/server/validation";
import { Panel, StatTile, StatusPill } from "@/components/app/ui";
import { KycDecisionForm, ApplicationDecisionForm } from "./forms";

/** Esteira de análise: cadastros aguardando verificação e propostas em revisão. */
export default async function BackofficePage() {
  await requireRole("ANALYST", "ADMIN");

  const [kycQueue, applicationQueue, stats, audit] = await Promise.all([
    db.kycProfile.findMany({
      where: { status: "SUBMITTED" },
      include: { user: { include: { documents: true, references: true } } },
      orderBy: { submittedAt: "asc" },
      take: 10,
    }),
    db.creditApplication.findMany({
      where: { status: "UNDER_REVIEW" },
      include: { user: { include: { kyc: true } } },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
    Promise.all([
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.contract.count({ where: { status: "ACTIVE" } }),
      db.installment.count({ where: { status: "LATE" } }),
      db.contract.aggregate({ where: { status: "ACTIVE" }, _sum: { principalCents: true } }),
    ]),
    db.auditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const [customers, activeContracts, lateInstallments, principal] = stats;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Operação</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
          Esteira de análise
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Clientes" value={String(customers)} />
        <StatTile label="Contratos ativos" value={String(activeContracts)} accent />
        <StatTile label="Carteira liberada" value={formatBRL(principal._sum.principalCents ?? 0)} />
        <StatTile label="Parcelas em atraso" value={String(lateInstallments)} />
      </div>

      <Panel
        title={`Cadastros aguardando verificação (${kycQueue.length})`}
        description="Confira documentos e dados antes de aprovar. A decisão fica registrada na auditoria."
      >
        {kycQueue.length === 0 ? (
          <p className="text-muted text-sm">Nenhum cadastro na fila.</p>
        ) : (
          <ul className="space-y-5">
            {kycQueue.map((kyc) => (
              <li key={kyc.id} className="queue-item">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{kyc.user.name}</p>
                    <p className="text-micro mt-1">
                      {formatCpf(kyc.user.cpf)} · {kyc.user.email}
                    </p>
                    <p className="text-micro mt-1">
                      {kyc.occupation} · renda {formatBRL(kyc.monthlyIncomeCents)} ·{" "}
                      {kyc.city}/{kyc.state}
                    </p>
                  </div>
                  <StatusPill status={kyc.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {kyc.user.documents.map((document) => (
                    <a
                      key={document.id}
                      href={`/api/documentos/${document.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="doc-chip"
                    >
                      {DOCUMENT_TYPES[document.type as DocumentType] ?? document.type}
                    </a>
                  ))}
                </div>

                {kyc.user.references.length > 0 ? (
                  <p className="text-micro mt-3">
                    Referências:{" "}
                    {kyc.user.references
                      .map((reference) => `${reference.name} (${reference.relationship})`)
                      .join(", ")}
                  </p>
                ) : null}

                <div className="mt-5">
                  <KycDecisionForm userId={kyc.userId} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title={`Propostas em análise (${applicationQueue.length})`}
        description="Casos que a política automática não resolveu sozinha."
      >
        {applicationQueue.length === 0 ? (
          <p className="text-muted text-sm">Nenhuma proposta na fila.</p>
        ) : (
          <ul className="space-y-5">
            {applicationQueue.map((application) => (
              <li key={application.id} className="queue-item">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{application.user.name}</p>
                    <p className="text-micro num mt-1">
                      {formatBRL(application.amountCents)} em {application.termMonths}x ·{" "}
                      parcela{" "}
                      {application.installmentCents ? formatBRL(application.installmentCents) : "—"} ·{" "}
                      CET {application.cetYearlyBps ? formatBps(application.cetYearlyBps) : "—"} a.a.
                    </p>
                    <p className="text-micro mt-1">
                      Score {application.scoreAtDecision} · renda{" "}
                      {application.user.kyc ? formatBRL(application.user.kyc.monthlyIncomeCents) : "—"} ·{" "}
                      finalidade: {application.purpose}
                    </p>
                  </div>
                  <StatusPill status={application.status} />
                </div>

                <p className="text-muted mt-3 text-xs">
                  Motivo do encaminhamento: {application.decisionReason}
                </p>

                <div className="mt-5">
                  <ApplicationDecisionForm applicationId={application.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Auditoria" description="Últimos eventos registrados na plataforma.">
        <div className="table-scroll">
            <table className="table-valor" style={{ minWidth: "520px" }}>
              <thead>
                <tr>
                <th scope="col" >Quando</th>
                <th scope="col" >Autor</th>
                <th scope="col" >Ação</th>
                <th scope="col" >Entidade</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((log) => (
                <tr key={log.id} >
                  <td >
                    {log.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td >{log.actor?.name ?? "sistema"}</td>
                  <td className="cell-strong">{log.action}</td>
                  <td >{log.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-micro mt-4">
          <Link href="/app" className="link-lime underline">
            Voltar para a conta
          </Link>
        </p>
      </Panel>
    </div>
  );
}
