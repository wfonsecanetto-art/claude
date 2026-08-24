"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { CASHBACK } from "@/content/site";
import { demoPosition, formatBRL } from "@/lib/mock";
import { easeOut, viewportSoft } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TiltCard } from "@/components/ui/TiltCard";

/** Carteira digital abstrata: cartões empilhados com o saldo de exemplo. */
function WalletStack() {
  return (
    <div className="relative mx-auto w-full max-w-[420px] [perspective:1200px]">
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 40, rotateX: 18 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 8 }}
        viewport={viewportSoft}
        transition={easeOut(1)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Cartões ao fundo */}
        <div
          className="border-hairline bg-graphite/70 absolute inset-x-6 -top-6 h-32 rounded-2xl border"
          aria-hidden="true"
        />
        <div
          className="border-hairline bg-graphite/85 absolute inset-x-3 -top-3 h-32 rounded-2xl border"
          aria-hidden="true"
        />

        {/* Cartão principal */}
        <div className="border-lime/25 relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#161a19] to-[#050505] p-6">
          <span
            className="bg-lime/20 absolute -top-16 -right-10 h-40 w-40 rounded-full blur-[60px]"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="eyebrow text-[0.5625rem]">Cashback acumulado</p>
              <p className="font-display text-lime mt-2 text-[clamp(1.75rem,5vw,2.5rem)] leading-none font-extrabold tracking-tight tabular-nums">
                {formatBRL(demoPosition.cashbackAccrued)}
              </p>
            </div>
            <DemoBadge label="Exemplo" />
          </div>

          <div className="border-hairline relative mt-6 flex items-end justify-between border-t pt-4">
            <div>
              <p className="text-gray-valor text-[0.625rem] tracking-[0.16em] uppercase">
                Liberação
              </p>
              <p className="mt-1 text-xs text-white">Após quitação integral</p>
            </div>
            <p className="font-display text-xs font-extrabold tracking-[0.22em] text-white uppercase">
              Valor
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function Cashback() {
  return (
    <section
      aria-labelledby="cashback-title"
      className="relative overflow-x-clip py-24 md:py-32 lg:py-40"
    >
      <Backdrop glow="soft" grid={false} />

      <div className="container-valor">
        <div className="grid grid-cols-4 gap-y-14 lg:grid-cols-12 lg:items-center lg:gap-x-16">
          <div className="col-span-4 lg:col-span-6">
            <SectionHeader
              headingId="cashback-title"
              eyebrow={CASHBACK.eyebrow}
              lines={[CASHBACK.titleTop, CASHBACK.titleBottom]}
              accentLines={[1]}
              body={CASHBACK.body}
              titleClassName="text-[clamp(2rem,5vw,3.75rem)]"
            />

            <motion.div
              className="border-hairline mt-10 rounded-xl border p-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportSoft}
              transition={easeOut(0.8)}
            >
              <div className="flex items-center gap-2">
                <Info size={14} className="text-lime" aria-hidden="true" />
                <p className="eyebrow text-white">Condições aplicáveis</p>
              </div>
              <ul className="mt-4 space-y-2">
                {CASHBACK.conditions.map((condition) => (
                  <li key={condition} className="text-gray-valor flex gap-2.5 text-xs leading-relaxed">
                    <span className="bg-lime/60 mt-1.5 h-1 w-1 shrink-0 rounded-full" aria-hidden="true" />
                    {condition}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="col-span-4 lg:col-span-6">
            <WalletStack />

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {CASHBACK.cards.map((card, index) => (
                <TiltCard key={card.title} delay={index * 0.06} className="p-5" maxDeg={4}>
                  <h3 className="font-display text-xs font-extrabold tracking-[0.14em] text-lime uppercase">
                    {card.title}
                  </h3>
                  <p className="text-gray-valor mt-3 text-xs leading-relaxed">{card.description}</p>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
