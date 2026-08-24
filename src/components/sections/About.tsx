"use client";

import { motion } from "framer-motion";
import { ABOUT } from "@/content/site";
import { revealUp, stagger, viewportSoft } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ValorObjectFallback } from "@/components/three/ValorObjectFallback";

export function About() {
  return (
    <section
      id="sobre"
      aria-labelledby="about-title"
      className="grain relative overflow-x-clip py-24 md:py-32 lg:py-40"
    >
      <Backdrop glow="soft" />

      <div className="container-valor">
        <div className="grid grid-cols-4 gap-y-14 lg:grid-cols-12 lg:items-center lg:gap-x-16">
          <div className="col-span-4 lg:col-span-7">
            <SectionHeader
              headingId="about-title"
              eyebrow={ABOUT.eyebrow}
              lines={[ABOUT.titleTop, ABOUT.titleBottom]}
              accentLines={[1]}
              body={ABOUT.body}
            />

            <motion.dl
              className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2"
              variants={stagger(0.08)}
              initial="hidden"
              whileInView="visible"
              viewport={viewportSoft}
            >
              {ABOUT.blocks.map((block) => (
                <motion.div key={block.title} variants={revealUp}>
                  <dt className="font-display flex items-center gap-2.5 text-xs font-extrabold tracking-[0.18em] text-white uppercase">
                    <span className="bg-lime h-1.5 w-1.5 rounded-full" aria-hidden="true" />
                    {block.title}
                  </dt>
                  <dd className="text-gray-valor mt-3 text-sm leading-relaxed">
                    {block.description}
                  </dd>
                </motion.div>
              ))}
            </motion.dl>
          </div>

          <motion.div
            className="col-span-4 lg:col-span-5"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportSoft}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="valor-float mx-auto aspect-square w-full max-w-[440px]">
              <ValorObjectFallback />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
