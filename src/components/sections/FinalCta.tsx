"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { FINAL_CTA } from "@/content/site";
import { easeOut, viewportSoft } from "@/lib/motion";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function FinalCta() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const glowScale = useTransform(scrollYProgress, [0, 1], [0.7, 1.15]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [0, 0.55, 0.8]);

  return (
    <section
      id="contato"
      ref={ref}
      aria-labelledby="cta-title"
      className="grain bg-ink relative overflow-x-clip py-28 md:py-40 lg:py-48"
    >
      {/* Brilho verde atrás do CTA, respondendo à aproximação da seção. */}
      <motion.div
        aria-hidden="true"
        className="bg-lime/[0.16] pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[46vmax] w-[46vmax] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[130px]"
        style={{ scale: glowScale, opacity: glowOpacity }}
      />

      <div className="container-valor relative text-center">
        <DisplayTitle
          id="cta-title"
          as="h2"
          lines={[FINAL_CTA.titleTop, FINAL_CTA.titleBottom]}
          accentLines={[1]}
          className="mx-auto text-[clamp(2.5rem,10vw,7.5rem)]"
        />

        <motion.p
          className="text-gray-valor mx-auto mt-8 max-w-xl text-sm leading-relaxed md:text-base"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSoft}
          transition={easeOut(0.8, 0.2)}
        >
          {FINAL_CTA.body}
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSoft}
          transition={easeOut(0.9, 0.3)}
        >
          <MagneticButton href="/criar-conta" variant="primary" className="px-9 py-4 text-base">
            {FINAL_CTA.cta}
            <ArrowRight
              size={18}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </MagneticButton>
          <MagneticButton href="/entrar" variant="outline" className="px-9 py-4 text-base">
            {FINAL_CTA.secondary}
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
