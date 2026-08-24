import Link from "next/link";
import { requireUser } from "@/server/auth/guards";
import { AVAILABLE_TERMS, MIN_AMOUNT_CENTS } from "@/server/credit/rates";
import { quoteCredit } from "@/server/credit/schedule";
import { formatBRL, formatBps } from "@/server/money";
import { creditPosition } from "@/server/services/scoring";
import { onboardingState } from "@/server/services/onboarding";
import { Panel, SandboxNotice, StatTile } from "@/components/app/ui";
import { ApplyForm, SimulatorForm } from "./forms";

/**
 * Simulador e contratação.
 *
 * A simulação roda no servidor a partir dos parâmetros da URL: uma única
 * implementação da matemática financeira, igual à que gera o contrato, e a
 * página funciona mesmo sem JavaScript.
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
  const ceiling = Math.max(position.limit.availableCents, MIN_AMOUNT_CENTS);
  const askedCents =
    Math.round(Number(params.valor ?? 0) * 100) ||
    Math.min(position.limit.availableCents, 200_000);
  const requestedCents = Math.max(MIN_AMOUNT_CENTS, Math.min(askedCents, ceiling));
  // Simular acima do limite disponível só geraria uma recusa: a simulação é
  // ajustada, mas o cliente precisa saber que isso aconteceu.
  const clamped = askedCents > ceiling;
  const termMonths = AVAILABLE_TERMS.includes(Number(params.prazo) as (typeof AVAILABLE_TERMS)[number])
    ? Number(params.prazo)
    : 12;

  const quote = quoteCredit({
    requestedCents,
    termMonths,
    monthlyRateBps: position.limit.monthlyRateBps,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Crédito</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
          Simule e contrate
        </h1>
      </div>

      {!verified ? (
        <p className="border-amber-400/30 bg-amber-400/10 rounded-xl border px-4 py-3 text-sm text-amber-200">
          Conclua a{" "}
          <Link href="/app/verificacao" className="underline">
            verificação de identidade
          </Link>{" "}
          para contratar. A simulação abaixo já usa seu nível atual.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Limite disponível" value={formatBRL(position.limit.availableCents)} accent />
        <StatTile
          label="Taxa do nível"
          value={`${formatBps(position.limit.monthlyRateBps)} a.m.`}
          meta={`Nível ${position.score.level}`}
        />
        <StatTile
          label="Teto por renda"
          value={formatBRL(position.limit.incomeLimitCents)}
          meta="30% da renda por 12 meses"
        />
      </div>

      <Panel title="Simulador" description="Os valores abaixo são os mesmos que irão para o contrato.">
        {clamped ? (
          <p className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Ajustamos a simulação para {formatBRL(ceiling)}, seu limite disponível hoje. Quitar
            parcelas libera limite e aumenta seu score.
          </p>
        ) : null}
        <SimulatorForm
          defaultAmount={(requestedCents / 100).toFixed(2)}
          defaultTerm={termMonths}
          maxAmount={Math.max(position.limit.availableCents, MIN_AMOUNT_CENTS) / 100}
          terms={[...AVAILABLE_TERMS]}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Parcela mensal" value={formatBRL(quote.installmentCents)} accent />
          <StatTile label="Total a pagar" value={formatBRL(quote.totalPayableCents)} />
          <StatTile label="IOF" value={formatBRL(quote.iofCents)} meta="Financiado no contrato" />
          <StatTile
            label="CET"
            value={`${formatBps(quote.cetYearlyBps)} a.a.`}
            meta={`${formatBps(quote.monthlyRateBps)} a.m. de juros`}
          />
        </div>

        <details className="border-hairline mt-5 rounded-xl border p-4">
          <summary className="cursor-pointer text-sm font-semibold text-white">
            Ver as {quote.termMonths} parcelas
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead className="text-gray-valor">
                <tr className="border-hairline border-b">
                  <th scope="col" className="pb-2 font-medium">Nº</th>
                  <th scope="col" className="pb-2 font-medium">Vencimento</th>
                  <th scope="col" className="pb-2 text-right font-medium">Amortização</th>
                  <th scope="col" className="pb-2 text-right font-medium">Juros</th>
                  <th scope="col" className="pb-2 text-right font-medium">Parcela</th>
                </tr>
              </thead>
              <tbody className="text-gray-valor">
                {quote.installments.map((installment) => (
                  <tr key={installment.number} className="border-hairline border-b last:border-0">
                    <td className="py-2 text-white tabular-nums">{installment.number}</td>
                    <td className="py-2 tabular-nums">
                      {installment.dueDate.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatBRL(installment.principalCents)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatBRL(installment.interestCents)}
                    </td>
                    <td className="py-2 text-right text-white tabular-nums">
                      {formatBRL(installment.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Panel>

      {verified ? (
        <Panel title="Solicitar" description="A decisão é imediata quando todos os critérios da política são atendidos.">
          <ApplyForm amount={(requestedCents / 100).toFixed(2)} term={termMonths} />
        </Panel>
      ) : null}

      <SandboxNotice>
        Ambiente de homologação: a liberação credita a Conta Valor interna e os pagamentos usam o
        trilho SANDBOX. Nenhum recurso é movimentado fora da plataforma.
      </SandboxNotice>
    </div>
  );
}
