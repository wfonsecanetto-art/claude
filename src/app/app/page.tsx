import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { walletBalance } from "@/server/ledger";
import { formatBRL, formatBps } from "@/server/money";
import { creditPosition } from "@/server/services/scoring";
import { refreshOverdue } from "@/server/services/payments";
import { onboardingState } from "@/server/services/onboarding";
import { Panel, StatusPill } from "@/components/app/ui";
import { ServiceGrid } from "@/components/app/ServiceGrid";
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
  const cashbackCents = cashback._sum.amountCents ?? 0;
  const usoDoLimite =
    position.limit.approvedLimitCents > 0
      ? Math.min(position.outstandingCents / position.limit.approvedLimitCents, 1)
      : 0;

  return (
    <div className="space-y-6">
      {/* Faixa hero: saldo em primeiro plano, cartões de vidro sobrepostos. */}
      <section className="hero-band" aria-labelledby="saudacao">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            {/* O saldo é o maior elemento da tela, mas o título da página é o
                que nomeia a tela — nível semântico e tamanho visual são
                decisões separadas. */}
            <h1 className="hero-greeting" id="saudacao">
              Sua Conta Valor
            </h1>
            <p className="hero-balance">{formatBRL(balance)}</p>
            <p className="hero-sub">
              Olá, {user.name.split(" ")[0]} · saldo disponível
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/app/credito" className="btn btn-primary btn-sm">
                Pedir crédito
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link href="/app/transferir" className="btn btn-outline btn-sm">
                Transferir
              </Link>
              <Link href="/app/extrato" className="btn btn-outline btn-sm">
                Depositar
              </Link>
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="tile-label">Limite disponível</p>
                <p className="num font-display mt-1.5 text-2xl font-extrabold text-lime">
                  {formatBRL(position.limit.availableCents)}
                </p>
              </div>
              <ScoreRing
                points={position.score.points}
                max={1000}
                level={position.score.level}
                size={84}
                strokeWidth={5}
                compact
              />
            </div>

            {/* A barra mede o que está em uso — é a mesma leitura da frase abaixo. */}
            <div className="meter mt-4">
              <div
                className={`meter-fill ${usoDoLimite > 0.9 ? "meter-fill--over" : ""}`}
                style={{ width: `${usoDoLimite * 100}%` }}
              />
            </div>
            <p className="text-micro mt-2">
              {formatBRL(position.outstandingCents)} em uso de{" "}
              {formatBRL(position.limit.approvedLimitCents)} · {formatBps(position.limit.monthlyRateBps)} a.m.
            </p>
          </div>
        </div>
      </section>

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
            <Link href="/app/verificacao" className="btn btn-primary">
              Continuar <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <section aria-label="Serviços">
        <ServiceGrid />
      </section>

      {nextInstallment ? (
        <Panel title="Próximo vencimento">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="num font-display text-2xl font-extrabold text-white">
                {formatBRL(nextInstallment.totalCents)}
              </p>
              <p className="text-micro mt-1.5">
                Parcela {nextInstallment.number} do contrato {nextInstallment.contract.number} · vence
                em {nextInstallment.dueDate.toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill status={nextInstallment.status} />
              <Link
                href={`/app/contratos/${nextInstallment.contractId}`}
                className="btn btn-primary btn-sm"
              >
                Pagar
              </Link>
            </div>
          </div>
        </Panel>
      ) : null}

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
            {formatBRL(cashbackCents)}
          </p>
          <p className="text-muted mt-2 text-xs">
            Percentual sobre os juros pagos, conforme o nível de relacionamento no momento da
            quitação.
          </p>
          <p className="text-micro mt-4 flex items-center gap-2">
            <TrendingUp size={13} className="text-lime shrink-0" aria-hidden="true" />
            {position.score.pointsToNextLevel !== null && position.score.nextLevel
              ? `Faltam ${position.score.pointsToNextLevel} pontos para ${position.score.nextLevel} — e uma taxa menor.`
              : "Você está no nível máximo de relacionamento."}
          </p>
        </Panel>
      </div>
    </div>
  );
}
