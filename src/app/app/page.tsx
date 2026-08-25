import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { walletBalance } from "@/server/ledger";
import { formatBRL, formatBps } from "@/server/money";
import { creditPosition } from "@/server/services/scoring";
import { refreshOverdue } from "@/server/services/payments";
import { onboardingState } from "@/server/services/onboarding";
import { Panel, StatTile, StatusPill } from "@/components/app/ui";
import { ScoreRing } from "@/components/ui/ScoreRing";

export default async function AppHome() {
  const user = await requireUser();
  await refreshOverdue(user.id);

  const [position, balance, onboarding, contracts, nextInstallment, cashback] = await Promise.all([
    creditPosition(user.id),
    walletBalance(user.id),
    onboardingState(user.id),
    db.contract.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.installment.findFirst({
      where: { contract: { userId: user.id }, status: { not: "PAID" } },
      orderBy: { dueDate: "asc" },
      include: { contract: true },
    }),
    db.cashbackGrant.aggregate({
      where: { userId: user.id, status: "GRANTED" },
      _sum: { amountCents: true },
    }),
  ]);

  const needsVerification = onboarding.kycStatus !== "APPROVED";

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Olá, {user.name.split(" ")[0]}</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
          Sua Conta Valor
        </h1>
      </div>

      {needsVerification ? (
        <div className="callout">
          <div>
            <p className="font-display text-sm font-extrabold tracking-[0.12em] text-lime uppercase">
              Verificação pendente
            </p>
            <p className="text-muted mt-1.5 text-xs">
              {onboarding.kycStatus === "SUBMITTED"
                ? "Seu cadastro está em análise. Avisaremos assim que houver decisão."
                : "Conclua a verificação de identidade para liberar o crédito."}
            </p>
          </div>
          {onboarding.kycStatus !== "SUBMITTED" ? (
            <Link
              href="/app/verificacao"
              className="btn btn-primary"
            >
              Continuar <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Panel title="Posição de crédito" description="Limite calculado pelo seu nível e pela renda declarada.">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatTile
              label="Limite disponível"
              value={formatBRL(position.limit.availableCents)}
              meta={`de ${formatBRL(position.limit.approvedLimitCents)} aprovados`}
              accent
            />
            <StatTile label="Saldo na conta" value={formatBRL(balance)} meta="Conta Valor" />
            <StatTile
              label="Saldo devedor"
              value={formatBRL(position.outstandingCents)}
              meta={`${contracts.filter((c) => c.status === "ACTIVE").length} contratos ativos`}
            />
            <StatTile
              label="Taxa do seu nível"
              value={`${formatBps(position.limit.monthlyRateBps)} a.m.`}
              meta={`Nível ${position.score.level}`}
            />
          </div>

          {nextInstallment ? (
            <div className="inset-box mt-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="tile-label">Próximo vencimento</p>
                <p className="mt-1.5 text-sm text-white">
                  Parcela {nextInstallment.number} do contrato {nextInstallment.contract.number} ·{" "}
                  <span className="tabular-nums">{formatBRL(nextInstallment.totalCents)}</span> em{" "}
                  {nextInstallment.dueDate.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={nextInstallment.status} />
                <Link
                  href={`/app/contratos/${nextInstallment.contractId}`}
                  className="link-lime text-xs"
                >
                  Pagar
                </Link>
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel title="Score Valor">
          <div className="flex flex-col items-center">
            <ScoreRing
              points={position.score.points}
              max={1000}
              level={position.score.level}
              size={180}
              strokeWidth={7}
              compact
            />
            <p className="text-micro mt-4 text-center">
              {position.score.pointsToNextLevel !== null && position.score.nextLevel
                ? `Faltam ${position.score.pointsToNextLevel} pontos para ${position.score.nextLevel}.`
                : "Você está no nível máximo."}
            </p>
            <Link href="/app/score" className="link-lime mt-3 text-xs">
              Como o score é calculado
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel
          title="Contratos"
          action={
            <Link href="/app/contratos" className="link-lime text-xs">
              Ver todos
            </Link>
          }
        >
          {contracts.length === 0 ? (
            <p className="text-muted text-sm">
              Nenhum contrato ainda.{" "}
              <Link href="/app/credito" className="link-lime">
                Simular crédito
              </Link>
              .
            </p>
          ) : (
            <ul className="list-divided">
              {contracts.map((contract) => (
                <li key={contract.id} className="list-row">
                  <div>
                    <Link
                      href={`/app/contratos/${contract.id}`}
                      className="font-display text-xs font-bold tracking-[0.1em] text-white uppercase transition-colors hover:text-lime"
                    >
                      {contract.number}
                    </Link>
                    <p className="text-micro num mt-1">
                      {formatBRL(contract.principalCents)} · {contract.termMonths}x
                    </p>
                  </div>
                  <StatusPill status={contract.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Cashback" description="Creditado na conta após a quitação integral de cada contrato.">
          <p className="font-display num text-lime text-3xl font-extrabold tracking-tight">
            {formatBRL(cashback._sum.amountCents ?? 0)}
          </p>
          <p className="text-muted mt-2 text-xs">
            Percentual sobre os juros pagos, conforme o nível de relacionamento no momento da
            quitação.
          </p>
        </Panel>
      </div>
    </div>
  );
}
