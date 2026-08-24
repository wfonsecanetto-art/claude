"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { drawLine, easeOut, viewportSoft } from "@/lib/motion";
import { DisplayTitle } from "./DisplayTitle";

type SectionHeaderProps = {
  eyebrow: string;
  lines: string[];
  accentLines?: number[];
  body?: string;
  align?: "left" | "center";
  titleClassName?: string;
  children?: ReactNode;
  headingId?: string;
};

export function SectionHeader({
  eyebrow,
  lines,
  accentLines = [1],
  body,
  align = "left",
  titleClassName = "text-[clamp(2.25rem,6.2vw,5rem)]",
  children,
  headingId,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <motion.div
        className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportSoft}
        transition={easeOut(0.6)}
      >
        <span className="bg-lime h-1.5 w-1.5 rounded-full" aria-hidden="true" />
        <span className="eyebrow">{eyebrow}</span>
      </motion.div>

      <DisplayTitle
        id={headingId}
        lines={lines}
        accentLines={accentLines}
        className={`mt-5 ${titleClassName}`}
      />

      <motion.div
        className="rule-lime mt-7 h-px w-24 origin-left"
        style={centered ? { marginInline: "auto", transformOrigin: "center" } : undefined}
        variants={drawLine}
        initial="hidden"
        whileInView="visible"
        viewport={viewportSoft}
        aria-hidden="true"
      />

      {body ? (
        <motion.p
          className="text-gray-valor mt-6 max-w-2xl text-base leading-relaxed md:text-lg"
          style={centered ? { marginInline: "auto" } : undefined}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSoft}
          transition={easeOut(0.8, 0.1)}
        >
          {body}
        </motion.p>
      ) : null}

      {children}
    </div>
  );
}
