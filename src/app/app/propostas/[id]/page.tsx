import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { formatBRL, formatBps } from "@/server/money";
import { Panel, StatTile, StatusPill } from "@/components/app/ui";

/** Resultado da análise de uma proposta, com a justificativa da decisão. */
export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const application = await db.creditApplication.findUnique({
    where: { id },
    include: { contract: true },
  });

  if (!application || application.userId !== user.id) notFound();

  const outcomeCopy: Record<string, { title: string; body: string }> = {
    APPROVED: {
      title: "Proposta aprovada",
      body: "Revise as condições e assine o contrato para receber o valor na sua Conta Valor.",
    },
    CONTRACTED: {
      title: "Proposta contratada",
      body: "O contrato já foi assinado e o valor liberado.",
    },
    UNDER_REVIEW: {
      title: "Proposta em análise",
      body: "Um analista vai avaliar seu pedido. Você será avisado quando houver decisão.",
    },
    REJECTED: {
      title: "Proposta recusada",
      body: "A decisão levou em conta os critérios da política de crédito descritos abaixo.",
    },
    CANCELLED: { title: "Proposta cancelada", body: "Esta proposta foi cancelada." },
  };

  const copy = outcomeCopy[application.status] ?? outcomeCopy.UNDER_REVIEW;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Proposta</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
            {copy.title}
          </h1>
        </div>
        <StatusPill status={application.status} />
      </div>

      <p className="text-gray-valor text-sm leading-relaxed">{copy.body}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Valor solicitado" value={formatBRL(application.amountCents)} accent />
        <StatTile label="Prazo" value={`${application.termMonths} meses`} />
        <StatTile
          label="Parcela"
          value={application.installmentCents ? formatBRL(application.installmentCents) : "—"}
        />
        <StatTile
          label="CET"
          value={application.cetYearlyBps ? `${formatBps(application.cetYearlyBps)} a.a.` : "—"}
          meta={application.scoreAtDecision ? `Score na decisão: ${application.scoreAtDecision}` : undefined}
        />
      </div>

      <Panel title="Justificativa da decisão">
        <p className="text-gray-valor text-sm leading-relaxed">
          {application.decisionReason ?? "Aguardando análise."}
        </p>
        <p className="text-gray-valor mt-4 text-[0.6875rem]">
          Registrado em {application.createdAt.toLocaleString("pt-BR")} · finalidade:{" "}
          {application.purpose}
        </p>
      </Panel>

      {application.contract ? (
        <Link
          href={`/app/contratos/${application.contract.id}`}
          className="bg-lime text-ink inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold"
        >
          {application.contract.status === "AWAITING_SIGNATURE" ? "Ver e assinar contrato" : "Ver contrato"}
        </Link>
      ) : null}
    </div>
  );
}
