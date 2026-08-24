"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import { useRef } from "react";
import { MICROCREDIT } from "@/content/site";
import { easeOut, viewportSoft } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * Fluxo do produto em seis etapas.
 *
 * A coluna da esquerda fica presa (sticky) enquanto as etapas passam à direita;
 * a linha verde-limão preenche na medida do progresso da leitura.
 */
export function Microcredit() {
  const trackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 70%", "end 60%"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.6 });
  const percent = useTransform(progress, (value) => `${Math.round(value * 100)}%`);

  return (
    <section
      id="como-funciona"
      aria-labelledby="microcredito-title"
      className="relative overflow-x-clip py-24 md:py-32 lg:py-40"
    >
      <Backdrop glow="none" />

      <div className="container-valor">
        <div className="grid grid-cols-4 gap-y-12 lg:grid-cols-12 lg:gap-x-12">
          <div className="col-span-4 lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <SectionHeader
                headingId="microcredito-title"
                eyebrow={MICROCREDIT.eyebrow}
                lines={[MICROCREDIT.titleTop, MICROCREDIT.titleBottom]}
                accentLines={[1]}
                body={MICROCREDIT.intro}
                titleClassName="text-[clamp(2rem,4.6vw,3.5rem)]"
              />

              <div className="mt-10 hidden lg:block">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Progresso do fluxo</span>
                  <motion.span className="font-display text-lime text-xs font-extrabold tracking-[0.2em]">
                    {percent}
                  </motion.span>
                </div>
                <div className="bg-hairline mt-3 h-px w-full overflow-hidden">
                  <motion.div
                    className="bg-lime h-full w-full origin-left"
                    style={{ scaleX: progress }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>

          <div ref={trackRef} className="relative col-span-4 lg:col-span-8">
            {/* Trilho conectando as etapas */}
            <div
              className="bg-hairline absolute top-2 bottom-2 left-[1.35rem] w-px md:left-[2.15rem]"
              aria-hidden="true"
            >
              <motion.div
                className="from-lime to-lime/20 h-full w-full origin-top bg-gradient-to-b"
                style={{ scaleY: progress }}
              />
            </div>

            <ol className="space-y-4 md:space-y-5">
              {MICROCREDIT.steps.map((step, index) => (
                <motion.li
                  key={step.id}
                  className="relative pl-14 md:pl-24"
                  initial={{ opacity: 0, y: 34, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={easeOut(0.75, index * 0.04)}
                >
                  {/* Marcador no trilho */}
                  <span
                    className="border-hairline-strong bg-ink absolute top-6 left-0 flex h-11 w-11 items-center justify-center rounded-full border md:left-[0.9rem]"
                    aria-hidden="true"
                  >
                    <span className="bg-lime h-2 w-2 rounded-full" />
                  </span>

                  <div className="surface-card group hover:border-lime/30 rounded-2xl p-6 transition-colors duration-500 md:p-8">
                    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                      <span className="font-display text-white/[0.14] text-[clamp(2.5rem,7vw,4.5rem)] leading-none font-extrabold tracking-tighter transition-colors duration-500 group-hover:text-lime/35">
                        {step.id}
                      </span>
                      <h3 className="font-display text-xl font-extrabold tracking-[0.02em] text-white uppercase md:text-2xl">
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-gray-valor mt-4 max-w-xl text-sm leading-relaxed md:text-base">
                      {step.description}
                    </p>

                    <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-center gap-2">
                          <Check size={13} className="text-lime shrink-0" aria-hidden="true" />
                          <span className="text-gray-valor text-xs tracking-wide">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.li>
              ))}
            </ol>

            <motion.p
              className="text-gray-valor mt-8 pl-14 text-xs leading-relaxed md:pl-24"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportSoft}
              transition={easeOut(0.8)}
            >
              Fluxo previsto no projeto: cadastro, KYC, documentos, referências, solicitação,
              análise, score, aprovação, contrato, liberação e pagamentos.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
