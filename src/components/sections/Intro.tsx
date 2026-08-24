"use client";

import { motion } from "framer-motion";
import { ABOUT_INTRO } from "@/content/site";
import { easeOut, stagger, revealUp, viewportSoft } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * Composição de crescimento: uma linha verde-limão sobe entre marcos,
 * desenhada conforme a seção entra na tela.
 */
function GrowthComposition() {
  // Curva plotada de ponta a ponta da área útil: sem bordas duras no preenchimento.
  const curve = "M40 254 C 92 246, 108 224, 140 208 S 200 178, 240 148 S 306 110, 340 84";
  const baseline = 272;
  const nodes = [
    { x: 40, y: 254, label: "Cadastro", anchor: "start" as const },
    { x: 140, y: 208, label: "Análise", anchor: "middle" as const },
    { x: 240, y: 148, label: "Crédito", anchor: "middle" as const },
    { x: 340, y: 84, label: "Evolução", anchor: "end" as const },
  ];

  return (
    <div className="relative">
      <div
        className="bg-lime/[0.07] absolute inset-x-10 top-1/4 h-1/2 rounded-full blur-[70px]"
        aria-hidden="true"
      />

      <motion.svg
        viewBox="0 0 380 300"
        className="relative w-full"
        role="img"
        aria-label="Gráfico ascendente ligando cadastro, análise, crédito e evolução."
        initial="hidden"
        whileInView="visible"
        viewport={viewportSoft}
      >
        <defs>
          <linearGradient id="intro-line" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#7fb300" />
            <stop offset="100%" stopColor="#b7ff00" />
          </linearGradient>
          <linearGradient id="intro-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b7ff00" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#b7ff00" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Malha de referência */}
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
          {[76, 125, 174, 223].map((y) => (
            <line key={y} x1="40" y1={y} x2="340" y2={y} />
          ))}
        </g>
        <line x1="40" y1={baseline} x2="340" y2={baseline} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />

        <motion.path
          d={`${curve} L340 ${baseline} L40 ${baseline} Z`}
          fill="url(#intro-fill)"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.9, delay: 0.4 } },
          }}
        />

        <motion.path
          d={curve}
          fill="none"
          stroke="url(#intro-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: {
              pathLength: 1,
              opacity: 1,
              transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        />

        {nodes.map((node, index) => (
          <motion.g
            key={node.label}
            variants={{
              hidden: { opacity: 0, scale: 0.5 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.5, delay: 0.35 + index * 0.14 },
              },
            }}
            style={{ transformOrigin: `${node.x}px ${node.y}px` }}
          >
            <circle cx={node.x} cy={node.y} r="9" fill="#050505" stroke="#b7ff00" strokeWidth="1.5" />
            <circle cx={node.x} cy={node.y} r="3" fill="#b7ff00" />
            <text
              x={node.x}
              y={baseline + 20}
              textAnchor={node.anchor}
              fill="#a5a5a5"
              fontSize="10"
              letterSpacing="1.6"
              style={{ textTransform: "uppercase" }}
            >
              {node.label}
            </text>
          </motion.g>
        ))}
      </motion.svg>
    </div>
  );
}

export function Intro() {
  return (
    <section
      id="solucoes"
      aria-labelledby="intro-title"
      className="relative overflow-x-clip py-24 md:py-32 lg:py-40"
    >
      <Backdrop glow="soft" grid={false} />

      <div className="container-valor">
        <div className="grid grid-cols-4 gap-y-14 lg:grid-cols-12 lg:items-center lg:gap-x-12">
          <div className="col-span-4 lg:col-span-6">
            <SectionHeader
              headingId="intro-title"
              eyebrow={ABOUT_INTRO.eyebrow}
              lines={[ABOUT_INTRO.titleTop, ABOUT_INTRO.titleBottom]}
              accentLines={[1]}
              body={ABOUT_INTRO.body}
              titleClassName="text-[clamp(2rem,5vw,3.75rem)]"
            />

            <motion.ul
              className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3"
              variants={stagger(0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={viewportSoft}
            >
              {ABOUT_INTRO.pillars.map((pillar) => (
                <motion.li key={pillar.title} variants={revealUp} className="bg-graphite/80 p-6">
                  <h3 className="font-display text-sm font-extrabold tracking-[0.14em] text-lime uppercase">
                    {pillar.title}
                  </h3>
                  <p className="text-gray-valor mt-3 text-sm leading-relaxed">{pillar.description}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            className="col-span-4 lg:col-span-6"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportSoft}
            transition={easeOut(1)}
          >
            <div className="surface-card relative rounded-3xl p-6 md:p-10">
              <div className="mb-6 flex items-center justify-between">
                <span className="eyebrow">Trajetória do cliente</span>
                <span className="eyebrow text-lime">Ilustrativo</span>
              </div>
              <GrowthComposition />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
