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
            <p className="text-muted mt-4 text-center text-xs">
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
          <ul className="list-divided">
            {factors.map((factor) => (
              <li key={factor.key} className="list-row list-row-start">
                <div>
                  <p className="text-sm text-white">{factor.label}</p>
                  <p className="text-micro mt-1">
                    {factor.detail}
                  </p>
                </div>
                <p
                  className={`num text-sm font-semibold ${
                    factor.points > 0 ? "text-lime" : factor.points < 0 ? "text-red-300" : "text-muted"
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
        <div className="table-scroll">
            <table className="table-valor" style={{ minWidth: "480px" }}>
              <thead>
                <tr>
                <th scope="col" >Nível</th>
                <th scope="col" >Faixa</th>
                <th scope="col" className="cell-right">Taxa</th>
                <th scope="col" className="cell-right">Teto</th>
                <th scope="col" className="cell-right">Cashback</th>
              </tr>
            </thead>
            <tbody>
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
                    <td >
                      {LEVEL_RANGES[level].min} – {LEVEL_RANGES[level].max}
                    </td>
                    <td className="cell-right">
                      {formatBps(LEVEL_POLICY[level].monthlyRateBps)} a.m.
                    </td>
                    <td className="cell-right">
                      {formatBRLCompact(LEVEL_POLICY[level].limitCents)}
                    </td>
                    <td className="cell-right">
                      {formatBps(LEVEL_POLICY[level].cashbackOnInterestBps, 0)} dos juros
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-micro mt-4">
          O limite efetivo é o menor entre o teto do nível e 30% da renda declarada projetada em 12
          meses.
        </p>
      </Panel>

      {history.length > 1 ? (
        <Panel title="Histórico">
          <ul className="list-divided">
            {history.map((snapshot) => (
              <li key={snapshot.id} className="list-row">
                <div>
                  <p className="text-sm text-white">{snapshot.reason}</p>
                  <p className="text-micro mt-1">
                    {snapshot.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <p className="font-display num text-sm font-extrabold text-white">
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
