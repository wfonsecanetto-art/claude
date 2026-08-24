"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { HERO } from "@/content/site";
import { usePointerParallax } from "@/lib/hooks";
import { easeOut, stagger, viewportOnce, wordReveal } from "@/lib/motion";
import { HeroVisual } from "@/components/three/HeroVisual";
import { Backdrop } from "@/components/ui/Backdrop";
import { MagneticButton } from "@/components/ui/MagneticButton";

/** Primeira impressão: tipografia gigante à esquerda, objeto Valor à direita. */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { x, y } = usePointerParallax(12);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const titleLines = [
    { text: HERO.titleTop, accent: false },
    { text: HERO.titleBottom, accent: true },
  ];

  return (
    <section
      id="inicio"
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="grain relative flex min-h-[100svh] items-center overflow-x-clip pt-[104px] pb-16 lg:pt-[72px] lg:pb-0"
    >
      <Backdrop glow="strong" />

      <div className="container-valor relative w-full">
        <div className="grid grid-cols-4 items-center gap-y-12 lg:grid-cols-12 lg:gap-x-8">
          {/* Conteúdo editorial */}
          <motion.div
            className="col-span-4 lg:col-span-7"
            style={{ y: contentY, opacity: fade }}
          >
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={easeOut(0.7, 0.2)}
            >
              <span className="border-hairline-strong bg-graphite/60 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
                <span className="bg-lime h-1.5 w-1.5 animate-pulse rounded-full" aria-hidden="true" />
                <span className="eyebrow text-white">{HERO.eyebrow}</span>
              </span>
              <span className="eyebrow hidden sm:inline">{HERO.meta.join(" · ")}</span>
            </motion.div>

            <motion.h1
              id="hero-title"
              aria-label={`${HERO.titleTop} ${HERO.titleBottom}`}
              className="display mt-7 text-[clamp(2.5rem,7.4vw,6.25rem)]"
              variants={stagger(0.075, 0.35)}
              initial="hidden"
              animate="visible"
            >
              {titleLines.map((line) => (
                <span key={line.text} className="block pt-[0.04em] pb-[0.1em]">
                  <span aria-hidden="true" className={line.accent ? "text-lime text-glow-lime" : ""}>
                    {line.text.split(" ").map((word, index) => (
                      <motion.span
                        key={`${word}-${index}`}
                        variants={wordReveal}
                        className="inline-block will-change-transform"
                      >
                        {word}
                        {index < line.text.split(" ").length - 1 ? " " : ""}
                      </motion.span>
                    ))}
                  </span>
                </span>
              ))}
            </motion.h1>

            <motion.p
              className="text-gray-valor mt-8 max-w-xl text-base leading-relaxed md:text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={easeOut(0.9, 0.75)}
            >
              {HERO.subtitle}
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={easeOut(0.9, 0.9)}
            >
              <MagneticButton href="#contato" variant="primary">
                {HERO.primaryCta}
                <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
              </MagneticButton>
              <MagneticButton href="#solucoes" variant="outline">
                {HERO.secondaryCta}
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* Objeto Valor */}
          <motion.div
            className="col-span-4 lg:col-span-5"
            style={{ y: visualY, opacity: fade }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={easeOut(1, 0.3)}
          >
            <motion.div
              className="relative mx-auto aspect-square w-full max-w-[min(78vw,560px)]"
              style={{ x, y }}
            >
              <HeroVisual />
            </motion.div>
          </motion.div>
        </div>

        {/* Indicadores discretos */}
        <motion.div
          className="border-hairline mt-14 flex flex-wrap items-center justify-between gap-4 border-t pt-6 lg:mt-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={easeOut(0.8, 1)}
          style={{ opacity: fade }}
        >
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {HERO.badges.map((badge) => (
              <div key={badge.label} className="flex items-baseline gap-3">
                <span className="font-display text-xs font-extrabold tracking-[0.2em] text-white uppercase">
                  {badge.label}
                </span>
                <span className="eyebrow">{badge.meta}</span>
              </div>
            ))}
          </div>

          <a
            href="#solucoes"
            className="text-gray-valor group inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase transition-colors hover:text-lime"
          >
            Role para explorar
            <ArrowDown
              size={14}
              aria-hidden="true"
              className="transition-transform duration-500 group-hover:translate-y-1"
            />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
