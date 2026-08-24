"use client";

import { motion } from "framer-motion";
import { NUMBERS } from "@/content/site";
import { useCountUp, useInViewOnce } from "@/lib/hooks";
import { easeOut, viewportSoft } from "@/lib/motion";
import { Backdrop } from "@/components/ui/Backdrop";
import { SectionHeader } from "@/components/ui/SectionHeader";

type NumberItem = (typeof NUMBERS.items)[number];

/** Um número gigante com count-up; símbolos (∞) entram sem contagem. */
function BigNumber({ item, index }: { item: NumberItem; index: number }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.5);
  const animated = useCountUp(item.value ?? 0, inView && item.value !== null, 1500);

  // A contagem precisa passar por valores coerentes: 00.543 → 01.000, nunca 01.543.
  const current = Math.round(animated);
  const rendered =
    item.value === null
      ? item.display
      : item.value >= 1000
        ? `${String(Math.floor(current / 1000)).padStart(2, "0")}.${String(current % 1000).padStart(3, "0")}`
        : String(current).padStart(2, "0");

  return (
    <motion.div
      ref={ref}
      className="border-hairline hover:border-lime/30 group relative border-t pt-6 transition-colors duration-500"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportSoft}
      transition={easeOut(0.8, index * 0.08)}
    >
      <span
        aria-hidden="true"
        className="bg-lime absolute inset-x-0 top-0 h-px origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100"
      />
      <p
        className="font-display text-[clamp(3rem,9vw,6.5rem)] leading-none font-extrabold tracking-[-0.05em] text-white tabular-nums transition-colors duration-500 group-hover:text-lime"
        aria-label={item.display}
      >
        <span aria-hidden="true">{rendered}</span>
      </p>
      <p className="font-display mt-5 text-xs font-extrabold tracking-[0.18em] text-white uppercase">
        {item.label}
      </p>
      <p className="text-gray-valor mt-1.5 text-[0.6875rem] tracking-wide">{item.meta}</p>
    </motion.div>
  );
}

export function Numbers() {
  return (
    <section
      aria-labelledby="numbers-title"
      className="relative overflow-x-clip py-24 md:py-32 lg:py-40"
    >
      <Backdrop glow="none" />

      <div className="container-valor">
        <SectionHeader
          headingId="numbers-title"
          eyebrow={NUMBERS.eyebrow}
          lines={[NUMBERS.titleTop, NUMBERS.titleBottom]}
          accentLines={[1]}
        />

        <div className="mt-16 grid grid-cols-4 gap-x-8 gap-y-12 lg:grid-cols-12">
          {NUMBERS.items.map((item, index) => (
            <div key={item.label} className="col-span-4 sm:col-span-2 lg:col-span-3">
              <BigNumber item={item} index={index} />
            </div>
          ))}
        </div>

        <p className="text-gray-valor mt-12 text-xs leading-relaxed">{NUMBERS.note}</p>
      </div>
    </section>
  );
}
