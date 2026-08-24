"use client";

import { motion } from "framer-motion";
import { SCORE } from "@/content/site";
import { demoScore, demoScoreHistory } from "@/lib/mock";
import { easeOut, revealUp, stagger, viewportSoft } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { SectionHeader } from "@/components/ui/SectionHeader";

/** Série histórica do score, desenhada como sparkline. */
function ScoreHistory() {
  const width = 420;
  const height = 120;
  // Escala ajustada à série: em 0–1.000 a curva vira uma reta sem informação.
  const floor = 260;
  const ceiling = 900;
  const points = demoScoreHistory.map((value, index) => {
    const x = (index / (demoScoreHistory.length - 1)) * width;
    const y = height - ((value - floor) / (ceiling - floor)) * height;
    return { x, y, value };
  });
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 4}`}
      className="w-full"
      role="img"
      aria-label={`Evolução do score em ${demoScoreHistory.length} ciclos, de ${demoScoreHistory[0]} a ${demoScore.points} pontos — série de demonstração.`}
    >
      <defs>
        <linearGradient id="history-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7fb300" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#b7ff00" />
        </linearGradient>
        <linearGradient id="history-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b7ff00" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#b7ff00" stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.polygon
        points={`0,${height} ${path} ${width},${height}`}
        fill="url(#history-fill)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportSoft}
        transition={{ duration: 0.9, delay: 0.5 }}
      />

      <motion.polyline
        points={path}
        fill="none"
        stroke="url(#history-stroke)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={viewportSoft}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
      />

      {points.map((point, index) => (
        <motion.circle
          key={point.value}
          cx={point.x}
          cy={point.y}
          r="2.5"
          fill="#050505"
          stroke="#b7ff00"
          strokeWidth="1.2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.75 }}
          viewport={viewportSoft}
          transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
        />
      ))}

      <motion.circle
        cx={last.x}
        cy={last.y}
        r="5"
        fill="#b7ff00"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={viewportSoft}
        transition={{ duration: 0.5, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${last.x}px ${last.y}px` }}
      />
    </svg>
  );
}

export function Score() {
  return (
    <section
      aria-labelledby="score-title"
      className="relative overflow-x-clip py-24 md:py-32 lg:py-40"
    >
      <Backdrop glow="soft" grid={false} />

      <div className="container-valor">
        <div className="grid grid-cols-4 gap-y-14 lg:grid-cols-12 lg:items-center lg:gap-x-16">
          <div className="col-span-4 lg:col-span-5">
            <div className="relative flex flex-col items-center">
              <div
                className="bg-lime/10 absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
                aria-hidden="true"
              />
              <motion.div
                className="valor-float relative"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={viewportSoft}
                transition={easeOut(0.9)}
              >
                <ScoreRing
                  points={demoScore.points}
                  max={demoScore.max}
                  level={demoScore.level}
                  size={288}
                />
              </motion.div>
              <DemoBadge className="mt-8" label="Score de demonstração" />
            </div>
          </div>

          <div className="col-span-4 lg:col-span-7">
            <SectionHeader
              headingId="score-title"
              eyebrow={SCORE.eyebrow}
              lines={[SCORE.titleTop, SCORE.titleBottom]}
              accentLines={[1]}
              body={SCORE.body}
              titleClassName="text-[clamp(2rem,5vw,3.75rem)]"
            />

            <motion.ul
              className="border-hairline mt-12 grid gap-px overflow-hidden rounded-2xl border bg-hairline sm:grid-cols-5"
              variants={stagger(0.08)}
              initial="hidden"
              whileInView="visible"
              viewport={viewportSoft}
            >
              {SCORE.levels.map((level) => {
                const isCurrent = level.name === demoScore.level;
                return (
                  <motion.li
                    key={level.name}
                    variants={revealUp}
                    className={`relative p-4 transition-colors duration-500 ${
                      isCurrent ? "bg-lime/10" : "bg-graphite/80"
                    }`}
                  >
                    {isCurrent ? (
                      <span className="bg-lime absolute inset-x-0 top-0 h-px" aria-hidden="true" />
                    ) : null}
                    <p
                      className={`font-display text-xs font-extrabold tracking-[0.16em] uppercase ${
                        isCurrent ? "text-lime" : "text-white"
                      }`}
                    >
                      {level.name}
                    </p>
                    <p className="text-gray-valor mt-1.5 text-[0.6875rem] tabular-nums">
                      {level.range}
                    </p>
                    {isCurrent ? (
                      <p className="text-lime mt-2 text-[0.5625rem] tracking-[0.16em] uppercase">
                        Exemplo atual
                      </p>
                    ) : null}
                  </motion.li>
                );
              })}
            </motion.ul>

            <div className="surface-card mt-6 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Evolução ao longo dos ciclos</p>
                <p className="text-gray-valor text-[0.6875rem] tracking-[0.16em] uppercase">
                  12 ciclos · exemplo
                </p>
              </div>
              <div className="mt-5">
                <ScoreHistory />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
