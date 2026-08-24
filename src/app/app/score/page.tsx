import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { LEVEL_RANGES, SCORE_LEVELS, type ScoreFactor } from "@/server/credit/score";
import { LEVEL_POLICY } from "@/server/credit/rates";
import { formatBRLCompact, formatBps } from "@/server/money";
import { creditPosition } from "@/server/services/scoring";
import { Panel } from "@/components/app/ui";
import { ScoreRing } from "@/components/ui/ScoreRing";

export default async function ScorePage() {
  const user = await requireUser();
  const [position, history] = await Promise.all([
    creditPosition(user.id),
    db.scoreSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const factors = position.score.factors as ScoreFactor[];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Score Valor</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
          Sua pontuação
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Panel>
          <div className="flex flex-col items-center">
            <ScoreRing
              points={position.score.points}
              max={1000}
              level={position.score.level}
              size={200}
            />
            <p className="text-gray-valor mt-4 text-center text-xs leading-relaxed">
              {position.score.pointsToNextLevel !== null && position.score.nextLevel
                ? `Faltam ${position.score.pointsToNextLevel} pontos para ${position.score.nextLevel}.`
                : "Nível máximo alcançado."}
            </p>
          </div>
        </Panel>

        <Panel
          title="Como chegamos a este número"
          description="Cada fator abaixo tem peso fixo. Nada é caixa-preta."
        >
          <ul className="divide-hairline divide-y">
            {factors.map((factor) => (
              <li key={factor.key} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm text-white">{factor.label}</p>
                  <p className="text-gray-valor mt-1 text-[0.6875rem] leading-relaxed">
                    {factor.detail}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    factor.points > 0 ? "text-lime" : factor.points < 0 ? "text-red-300" : "text-gray-valor"
                  }`}
                >
                  {factor.points > 0 ? "+" : ""}
                  {factor.points}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Níveis e condições">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="text-gray-valor">
              <tr className="border-hairline border-b">
                <th scope="col" className="pb-2 font-medium">Nível</th>
                <th scope="col" className="pb-2 font-medium">Faixa</th>
                <th scope="col" className="pb-2 text-right font-medium">Taxa</th>
                <th scope="col" className="pb-2 text-right font-medium">Teto</th>
                <th scope="col" className="pb-2 text-right font-medium">Cashback</th>
              </tr>
            </thead>
            <tbody className="text-gray-valor">
              {SCORE_LEVELS.map((level) => {
                const current = level === position.score.level;
                return (
                  <tr
                    key={level}
                    className={`border-hairline border-b last:border-0 ${current ? "bg-lime/[0.06]" : ""}`}
                  >
                    <td className={`py-2.5 font-semibold ${current ? "text-lime" : "text-white"}`}>
                      {level}
                      {current ? " · você" : ""}
                    </td>
                    <td className="py-2.5 tabular-nums">
                      {LEVEL_RANGES[level].min} – {LEVEL_RANGES[level].max}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatBps(LEVEL_POLICY[level].monthlyRateBps)} a.m.
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatBRLCompact(LEVEL_POLICY[level].limitCents)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatBps(LEVEL_POLICY[level].cashbackOnInterestBps, 0)} dos juros
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-gray-valor mt-4 text-[0.6875rem] leading-relaxed">
          O limite efetivo é o menor entre o teto do nível e 30% da renda declarada projetada em 12
          meses.
        </p>
      </Panel>

      {history.length > 1 ? (
        <Panel title="Histórico">
          <ul className="divide-hairline divide-y">
            {history.map((snapshot) => (
              <li key={snapshot.id} className="flex items-center justify-between gap-4 py-2.5">
                <div>
                  <p className="text-sm text-white">{snapshot.reason}</p>
                  <p className="text-gray-valor mt-1 text-[0.6875rem]">
                    {snapshot.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <p className="font-display text-sm font-extrabold text-white tabular-nums">
                  {snapshot.points}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
