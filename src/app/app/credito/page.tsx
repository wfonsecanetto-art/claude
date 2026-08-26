import Link from "next/link";
import { requireUser } from "@/server/auth/guards";
import { MIN_AMOUNT_CENTS } from "@/server/credit/rates";
import { formatBRL, formatBps } from "@/server/money";
import { creditPosition } from "@/server/services/scoring";
import { onboardingState } from "@/server/services/onboarding";
import { simulateAction } from "@/app/actions/credit";
import { PageHeading, Panel, SandboxNotice, StatTile } from "@/components/app/ui";
import { Simulator } from "./forms";

/**
 * Simulação e contratação.
 *
 * A primeira simulação é renderizada no servidor para que a página já chegue
 * com números na tela; a partir daí o componente cliente recalcula conforme o
 * cliente mexe nos controles, sempre chamando de volta o mesmo cálculo.
 */
export default async function CreditPage({
  searchParams,
}: {
  searchParams: Promise<{ valor?: string; prazo?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const [position, onboarding] = await Promise.all([
    creditPosition(user.id),
    onboardingState(user.id),
  ]);

  const verified = onboarding.kycStatus === "APPROVED";
  const valorPadrao =
    Math.round(Number(params.valor ?? 0) * 100) ||
    Math.min(Math.max(position.limit.availableCents, MIN_AMOUNT_CENTS), 200_000);

  const inicial = await simulateAction({
    amountCents: valorPadrao,
    termMonths: Number(params.prazo) || 12,
  });

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Crédito" title="Simule e contrate" />

      {!verified ? (
        <p className="alert alert-warning">
          Conclua a{" "}
          <Link href="/app/verificacao" className="underline">
            verificação de identidade
          </Link>{" "}
          para contratar. A simulação abaixo já usa as condições do seu nível.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Limite disponível" value={formatBRL(position.limit.availableCents)} accent />
        <StatTile
          label="Taxa do seu nível"
          value={`${formatBps(position.limit.monthlyRateBps)} a.m.`}
          meta={`Nível ${position.score.level}`}
        />
        <StatTile
          label="Teto por renda"
          value={formatBRL(position.limit.incomeLimitCents)}
          meta="30% da renda por 12 meses"
        />
      </div>

      <Panel
        title="Simulador"
        description="Mexa no valor e no prazo: os números mudam na hora, e são exatamente os que vão para o contrato."
      >
        <Simulator inicial={inicial} minimoCents={MIN_AMOUNT_CENTS} podeContratar={verified} />
      </Panel>

      <SandboxNotice>
        Ambiente de homologação: a liberação credita a Conta Valor interna e os pagamentos usam o
        trilho SANDBOX. Nenhum recurso é movimentado fora da plataforma.
      </SandboxNotice>
    </div>
  );
}
