"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { CYCLE } from "@/content/site";
import { revealUp, stagger, viewportSoft } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { SectionHeader } from "@/components/ui/SectionHeader";

/* Raio em % da largura do contêiner — aplicado a um elemento do tamanho do anel,
   porque translate percentual se refere ao próprio elemento. */
const RADIUS = 38;

/** Diagrama circular (telas médias e grandes). */
function CycleWheel() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      <div
        className="bg-lime/[0.07] absolute inset-[18%] rounded-full blur-[70px]"
        aria-hidden="true"
      />

      {/* Anéis de referência */}
      <div className="border-hairline absolute inset-0 rounded-full border" aria-hidden="true" />
      <div
        className="border-lime/20 absolute inset-[12%] rounded-full border border-dashed"
        aria-hidden="true"
      />

      {/* Anel giratório com os marcos */}
      <div className="valor-cycle-spin absolute inset-0" aria-hidden="true">
        {CYCLE.steps.map((step, index) => {
          const angle = (index / CYCLE.steps.length) * 360 - 90;
          return (
            /* Posiciona no anel… */
            <div
              key={step.label}
              className="absolute inset-0"
              style={{ transform: `rotate(${angle}deg) translate(${RADIUS}%, 0)` }}
            >
              {/* …desfaz a inclinação do posicionamento… */}
              <div
                className="absolute top-1/2 left-1/2 h-0 w-0"
                style={{ transform: `rotate(${-angle}deg)` }}
              >
                {/* …e cancela a rotação do anel, mantendo o rótulo na horizontal. */}
                <div className="valor-cycle-counter absolute h-0 w-0">
                  <div className="border-hairline-strong bg-graphite/90 absolute top-1/2 left-1/2 flex w-[112px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-center">
                    <span className="font-display text-[0.625rem] font-extrabold tracking-[0.16em] text-white uppercase">
                      {step.label}
                    </span>
                    <span className="bg-lime h-1 w-1 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Núcleo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="border-lime/30 bg-ink relative flex h-[38%] w-[38%] flex-col items-center justify-center rounded-full border">
          <span className="font-display text-lime text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold tracking-[0.14em] uppercase">
            Valor
          </span>
          <span className="eyebrow mt-1 text-[0.5rem]">Ciclo contínuo</span>
        </div>
      </div>
    </div>
  );
}

/** Versão vertical para telas pequenas — mesma informação, outra composição. */
function CycleList() {
  return (
    <motion.ol
      className="space-y-3"
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportSoft}
    >
      {CYCLE.steps.map((step, index) => (
        <motion.li key={step.label} variants={revealUp}>
          <div className="surface-card flex items-start gap-4 rounded-xl p-4">
            <span className="font-display text-lime text-xs font-extrabold tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="font-display text-sm font-extrabold tracking-[0.12em] text-white uppercase">
                {step.label}
              </p>
              <p className="text-gray-valor mt-1 text-xs leading-relaxed">{step.description}</p>
            </div>
          </div>
          {index < CYCLE.steps.length - 1 ? (
            <div className="flex justify-center py-1" aria-hidden="true">
              <ArrowDown size={14} className="text-lime/50" />
            </div>
          ) : null}
        </motion.li>
      ))}
    </motion.ol>
  );
}

export function Cycle() {
  return (
    <section
      aria-labelledby="cycle-title"
      className="relative overflow-x-clip py-24 md:py-32 lg:py-40"
    >
      <Backdrop glow="none" grid={false} />

      <div className="container-valor">
        <SectionHeader
          headingId="cycle-title"
          eyebrow={CYCLE.eyebrow}
          lines={[CYCLE.titleTop, CYCLE.titleBottom]}
          accentLines={[1]}
          body={CYCLE.body}
          align="center"
        />

        <div className="mt-16 grid grid-cols-4 gap-y-12 lg:grid-cols-12 lg:items-center lg:gap-x-16">
          <div className="col-span-4 hidden md:block lg:col-span-7">
            <CycleWheel />
          </div>

          <div className="col-span-4 md:hidden">
            <CycleList />
          </div>

          {/* Legenda textual — também é a leitura acessível do diagrama. */}
          <motion.ul
            className="col-span-4 hidden md:block lg:col-span-5"
            variants={stagger(0.07)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSoft}
          >
            {CYCLE.steps.map((step, index) => (
              <motion.li
                key={step.label}
                variants={revealUp}
                className="border-hairline hover:border-lime/30 group flex items-baseline gap-5 border-b py-4 transition-colors duration-500"
              >
                <span className="font-display text-gray-valor group-hover:text-lime text-xs font-extrabold tabular-nums transition-colors duration-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-display text-sm font-extrabold tracking-[0.12em] text-white uppercase">
                    {step.label}
                  </p>
                  <p className="text-gray-valor mt-1 text-xs leading-relaxed">{step.description}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
