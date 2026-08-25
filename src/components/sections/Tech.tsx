"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSearch,
  Lock,
  ScanFace,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useRef } from "react";
import { TECH } from "@/content/site";
import { easeOut, revealUp, stagger, viewportSoft } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TiltCard } from "@/components/ui/TiltCard";

const ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  lock: Lock,
  "scan-face": ScanFace,
  "brain-circuit": BrainCircuit,
  database: Database,
  workflow: Workflow,
  "file-search": FileSearch,
};

/**
 * Trilho horizontal de cards.
 *
 * Rolagem nativa com snap — funciona com teclado, roda do mouse e toque,
 * sem sequestrar a rolagem vertical da página.
 */
export function Tech() {
  const railRef = useRef<HTMLUListElement>(null);

  const scrollBy = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector("li");
    const amount = card ? card.clientWidth + 20 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: amount * direction, behavior: "smooth" });
  }, []);

  return (
    <section
      id="tecnologia"
      aria-labelledby="tech-title"
      className="relative overflow-x-clip py-24 md:py-32 lg:py-40"
    >
      <Backdrop glow="none" />

      <div className="container-valor">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeader
            headingId="tech-title"
            eyebrow={TECH.eyebrow}
            lines={[TECH.titleTop, TECH.titleBottom]}
            accentLines={[1]}
            body={TECH.body}
          />

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Ver cards anteriores"
              className="btn-icon"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Ver próximos cards"
              className="btn-icon"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative mt-14">
        {/* Máscaras laterais indicam continuidade sem cortar o conteúdo. */}
        <div
          aria-hidden="true"
          className="from-ink pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r to-transparent md:w-24"
        />
        <div
          aria-hidden="true"
          className="from-ink pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l to-transparent md:w-24"
        />

        <ul
          ref={railRef}
          className="no-scrollbar rail-inset flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4"
          tabIndex={0}
          aria-label="Pilares de tecnologia da plataforma"
        >
          {TECH.cards.map((card, index) => {
            const Icon = ICONS[card.icon] ?? ShieldCheck;
            return (
              <TiltCard
                key={card.title}
                as="li"
                delay={index * 0.05}
                className="w-[80vw] max-w-[340px] shrink-0 snap-start p-7 sm:w-[54vw] md:w-[38vw] lg:w-[26vw]"
              >
                <span className="border-lime/25 bg-lime/10 mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border">
                  <Icon size={20} className="text-lime" aria-hidden="true" />
                </span>
                <h3 className="font-display text-lg font-extrabold tracking-[0.08em] text-white uppercase">
                  {card.title}
                </h3>
                <p className="text-gray-valor mt-3 text-sm leading-relaxed">{card.description}</p>
                <span
                  aria-hidden="true"
                  className="via-lime/40 mt-7 block h-px w-full bg-gradient-to-r from-transparent to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-100"
                />
              </TiltCard>
            );
          })}
        </ul>
      </div>

      {/* Stack de referência */}
      <div className="container-valor mt-16">
        <motion.dl
          className="border-hairline grid gap-px overflow-hidden rounded-2xl border bg-hairline sm:grid-cols-2 lg:grid-cols-3"
          variants={stagger(0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSoft}
        >
          {TECH.stack.map((item) => (
            <motion.div key={item.layer} variants={revealUp} className="bg-graphite/80 p-5">
              <dt className="eyebrow">{item.layer}</dt>
              <dd className="font-display mt-2 text-sm font-bold tracking-wide text-white">
                {item.value}
              </dd>
            </motion.div>
          ))}
        </motion.dl>

        <motion.p
          className="text-gray-valor mt-6 text-xs leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportSoft}
          transition={easeOut(0.7)}
        >
          Arquitetura prevista para a plataforma. Integrações externas ainda não existentes são
          representadas por abstrações e dados de demonstração.
        </motion.p>
      </div>
    </section>
  );
}
