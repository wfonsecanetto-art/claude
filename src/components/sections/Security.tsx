"use client";

import { motion } from "framer-motion";
import { SECURITY } from "@/content/site";
import { easeOut, revealUp, stagger, viewportSoft } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * Rede de proteção: nós ligados por linhas que se desenham em sequência,
 * fechando um perímetro em torno do núcleo.
 */
function SecurityNetwork() {
  const nodes = [
    { x: 200, y: 40 },
    { x: 330, y: 110 },
    { x: 340, y: 250 },
    { x: 200, y: 330 },
    { x: 60, y: 250 },
    { x: 50, y: 110 },
  ];
  const center = { x: 200, y: 190 };

  const perimeter = nodes
    .map((node, index) => `${index === 0 ? "M" : "L"}${node.x} ${node.y}`)
    .join(" ")
    .concat(" Z");

  return (
    <div className="relative">
      <div
        className="bg-lime/[0.06] absolute inset-16 rounded-full blur-[90px]"
        aria-hidden="true"
      />
      <motion.svg
        viewBox="0 0 400 380"
        className="relative w-full"
        role="img"
        aria-label="Rede de nós interligados formando um perímetro de proteção em torno de um núcleo."
        initial="hidden"
        whileInView="visible"
        viewport={viewportSoft}
      >
        <defs>
          <radialGradient id="sec-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b7ff00" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#b7ff00" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#b7ff00" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Raios até o núcleo */}
        {nodes.map((node, index) => (
          <motion.line
            key={`spoke-${index}`}
            x1={center.x}
            y1={center.y}
            x2={node.x}
            y2={node.y}
            stroke="#b7ff00"
            strokeOpacity="0.22"
            strokeWidth="1"
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              visible: {
                pathLength: 1,
                opacity: 1,
                transition: { duration: 0.7, delay: 0.25 + index * 0.08 },
              },
            }}
          />
        ))}

        {/* Perímetro */}
        <motion.path
          d={perimeter}
          fill="none"
          stroke="#b7ff00"
          strokeOpacity="0.65"
          strokeWidth="1.5"
          strokeLinejoin="round"
          variants={{
            hidden: { pathLength: 0 },
            visible: { pathLength: 1, transition: { duration: 1.3, ease: [0.16, 1, 0.3, 1] } },
          }}
        />

        <circle cx={center.x} cy={center.y} r="70" fill="url(#sec-core)" opacity="0.28" />

        {nodes.map((node, index) => (
          <motion.g
            key={`node-${index}`}
            variants={{
              hidden: { opacity: 0, scale: 0.4 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.5, delay: 0.5 + index * 0.07 },
              },
            }}
            style={{ transformOrigin: `${node.x}px ${node.y}px` }}
          >
            <circle cx={node.x} cy={node.y} r="7" fill="#050505" stroke="#b7ff00" strokeWidth="1.5" />
            <circle cx={node.x} cy={node.y} r="2.5" fill="#b7ff00" />
          </motion.g>
        ))}

        <g>
          <circle cx={center.x} cy={center.y} r="26" fill="#050505" stroke="#b7ff00" strokeWidth="1.5" />
          <path
            d="M200 176 l14 6 v10 c0 9 -6 15 -14 18 c-8 -3 -14 -9 -14 -18 v-10 z"
            fill="none"
            stroke="#b7ff00"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      </motion.svg>
    </div>
  );
}

export function Security() {
  return (
    <section
      id="seguranca"
      aria-labelledby="security-title"
      className="grain relative overflow-x-clip py-24 md:py-32 lg:py-40"
    >
      <Backdrop glow="soft" />

      <div className="container-valor">
        <div className="grid grid-cols-4 gap-y-14 lg:grid-cols-12 lg:items-center lg:gap-x-16">
          <motion.div
            className="col-span-4 order-2 lg:order-1 lg:col-span-5"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportSoft}
            transition={easeOut(1)}
          >
            <SecurityNetwork />
          </motion.div>

          <div className="col-span-4 order-1 lg:order-2 lg:col-span-7">
            <SectionHeader
              headingId="security-title"
              eyebrow={SECURITY.eyebrow}
              lines={[SECURITY.titleTop, SECURITY.titleBottom]}
              accentLines={[1]}
              body={SECURITY.body}
              titleClassName="text-[clamp(2rem,5vw,3.75rem)]"
            />

            <motion.ul
              className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              variants={stagger(0.06)}
              initial="hidden"
              whileInView="visible"
              viewport={viewportSoft}
            >
              {SECURITY.controls.map((control) => (
                <motion.li
                  key={control.name}
                  variants={revealUp}
                  className="border-hairline hover:border-lime/30 hover:bg-lime/[0.04] group rounded-xl border p-4 transition-colors duration-500"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="bg-lime/60 group-hover:bg-lime h-1.5 w-1.5 rounded-full transition-colors duration-500"
                      aria-hidden="true"
                    />
                    <h3 className="font-display text-xs font-extrabold tracking-[0.14em] text-white uppercase">
                      {control.name}
                    </h3>
                  </div>
                  <p className="text-gray-valor mt-2 text-xs leading-relaxed">
                    {control.description}
                  </p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </div>
    </section>
  );
}
