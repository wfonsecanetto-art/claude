"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, CalendarClock, Wallet } from "lucide-react";
import { useRef } from "react";
import { DASHBOARD } from "@/content/site";
import { demoContracts, demoOffers, demoPosition, demoScore, formatBRL } from "@/lib/mock";
import { easeOut, revealUp, stagger, viewportSoft } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { SectionHeader } from "@/components/ui/SectionHeader";

const usageRatio = demoPosition.limitUsed / demoPosition.limitTotal;

function Tile({
  label,
  value,
  meta,
  className = "",
}: {
  label: string;
  value: string;
  meta?: string;
  className?: string;
}) {
  return (
    <div className={`border-hairline bg-ink/60 rounded-xl border p-4 ${className}`}>
      <p className="eyebrow text-[0.5625rem]">{label}</p>
      <p className="font-display mt-2 text-lg font-extrabold tracking-tight text-white tabular-nums md:text-xl">
        {value}
      </p>
      {meta ? <p className="text-gray-valor mt-1 text-[0.6875rem]">{meta}</p> : null}
    </div>
  );
}

/** Mockup do painel do cliente. Todos os valores vêm da camada de demonstração. */
function DashboardMockup() {
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-5 md:p-7">
      <span
        aria-hidden="true"
        className="via-lime/60 absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="border-lime/40 bg-lime/10 flex h-9 w-9 items-center justify-center rounded-full border">
            <Wallet size={15} className="text-lime" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Painel do cliente</p>
            <p className="text-gray-valor text-[0.6875rem]">Visão geral · exemplo</p>
          </div>
        </div>
        <DemoBadge />
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Score */}
        <div className="border-hairline bg-ink/60 flex flex-col items-center justify-center rounded-2xl border p-5">
          <ScoreRing
            points={demoScore.points}
            max={demoScore.max}
            level={demoScore.level}
            size={168}
            strokeWidth={7}
            compact
          />
          <p className="text-gray-valor mt-4 text-center text-[0.6875rem] leading-relaxed">
            Score Valor · <span className="text-lime">+{demoScore.delta}</span> pontos no último ciclo
          </p>
        </div>

        {/* Limite e posição */}
        <div className="flex flex-col gap-4">
          <div className="border-hairline bg-ink/60 rounded-2xl border p-5">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow text-[0.5625rem]">Limite disponível</p>
              <p className="text-gray-valor text-[0.6875rem] tabular-nums">
                de {formatBRL(demoPosition.limitTotal, false)}
              </p>
            </div>
            <p className="font-display mt-2 text-[clamp(1.75rem,4vw,2.5rem)] leading-none font-extrabold tracking-tight text-white tabular-nums">
              {formatBRL(demoPosition.limitTotal - demoPosition.limitUsed, false)}
            </p>

            <div className="bg-hairline mt-4 h-1.5 w-full overflow-hidden rounded-full">
              <motion.div
                className="from-lime-deep to-lime h-full rounded-full bg-gradient-to-r"
                initial={{ width: 0 }}
                whileInView={{ width: `${usageRatio * 100}%` }}
                viewport={viewportSoft}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />
            </div>
            <div className="text-gray-valor mt-2 flex justify-between text-[0.625rem]">
              <span>Utilizado {formatBRL(demoPosition.limitUsed, false)}</span>
              <span>{Math.round(usageRatio * 100)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Tile label="Saldo devedor" value={formatBRL(demoPosition.outstandingBalance)} />
            <Tile label="Parcela do dia" value={formatBRL(demoPosition.installmentToday)} />
            <Tile
              label="Próximo vencimento"
              value={demoPosition.nextDueDate}
              meta="Lembrete ativo"
            />
            <Tile
              label="Cashback"
              value={formatBRL(demoPosition.cashbackAccrued)}
              meta="Após quitação"
            />
          </div>
        </div>
      </div>

      {/* Contratos e ofertas */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="border-hairline bg-ink/60 rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-[0.5625rem]">Contratos</p>
            <CalendarClock size={14} className="text-gray-valor" aria-hidden="true" />
          </div>
          <ul className="mt-4 space-y-3">
            {demoContracts.map((contract) => (
              <li
                key={contract.id}
                className="border-hairline flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-display text-xs font-bold tracking-[0.12em] text-white uppercase">
                    {contract.id}
                  </p>
                  <p className="text-gray-valor text-[0.6875rem]">
                    {contract.installments} · {contract.openedAt}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white tabular-nums">
                    {formatBRL(contract.principal, false)}
                  </p>
                  <p
                    className={`text-[0.625rem] tracking-wider uppercase ${
                      contract.status === "Ativo" ? "text-lime" : "text-gray-valor"
                    }`}
                  >
                    {contract.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-hairline bg-ink/60 rounded-2xl border p-5">
          <p className="eyebrow text-[0.5625rem]">Ofertas liberadas</p>
          <ul className="mt-4 space-y-3">
            {demoOffers.map((offer) => (
              <li
                key={offer.id}
                className="border-hairline hover:border-lime/30 group flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors duration-300"
              >
                <div>
                  <p className="text-xs font-semibold text-white">{offer.title}</p>
                  <p className="text-gray-valor mt-1 text-[0.6875rem] leading-relaxed">
                    {offer.description}
                  </p>
                  <p className="text-gray-valor mt-1.5 text-[0.5625rem] tracking-[0.16em] uppercase">
                    Requer nível {offer.requiresLevel}
                  </p>
                </div>
                <ArrowUpRight
                  size={14}
                  aria-hidden="true"
                  className="text-gray-valor group-hover:text-lime mt-0.5 shrink-0 transition-colors"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // O mockup chega inclinado e se alinha conforme sobe na tela.
  const rotateX = useTransform(scrollYProgress, [0.1, 0.55], [14, 0]);
  const y = useTransform(scrollYProgress, [0.1, 0.6], [70, -20]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="dashboard-title"
      className="grain relative overflow-x-clip py-24 md:py-32 lg:py-40"
    >
      <Backdrop glow="strong" grid />

      <div className="container-valor">
        <SectionHeader
          headingId="dashboard-title"
          eyebrow={DASHBOARD.eyebrow}
          lines={[DASHBOARD.titleTop, DASHBOARD.titleBottom]}
          accentLines={[1]}
          body={DASHBOARD.body}
          align="center"
        />

        <motion.ul
          className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3"
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSoft}
        >
          {DASHBOARD.highlights.map((item) => (
            <motion.li
              key={item}
              variants={revealUp}
              className="text-gray-valor flex items-center gap-2 text-xs tracking-wide"
            >
              <span className="bg-lime h-1 w-1 rounded-full" aria-hidden="true" />
              {item}
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          className="mx-auto mt-16 max-w-5xl [perspective:1600px]"
          initial={{ opacity: 0, scale: 0.94, filter: "blur(16px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.2 }}
          transition={easeOut(1)}
        >
          <motion.div style={{ rotateX, y, transformStyle: "preserve-3d" }}>
            <DashboardMockup />
          </motion.div>
        </motion.div>

        <p className="text-gray-valor mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed">
          Mockup de interface do projeto piloto. Os valores são exemplos e não correspondem a
          contas, contratos ou operações reais.
        </p>
      </div>
    </section>
  );
}
