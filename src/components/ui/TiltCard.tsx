"use client";

import { motion, useMotionTemplate } from "framer-motion";
import type { ReactNode } from "react";
import { useCardTilt } from "@/lib/hooks";
import { revealUp, viewportSoft } from "@/lib/motion";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  maxDeg?: number;
  delay?: number;
  as?: "div" | "li" | "article";
};

/** Card com tilt 3D leve, borda que acende e brilho que segue o cursor. */
export function TiltCard({
  children,
  className = "",
  maxDeg = 5,
  delay = 0,
  as = "div",
}: TiltCardProps) {
  const { rotateX, rotateY, glareX, glareY, onPointerMove, onPointerLeave } =
    useCardTilt(maxDeg);

  const glare = useMotionTemplate`radial-gradient(320px circle at ${glareX}% ${glareY}%, rgba(183,255,0,0.14), transparent 60%)`;
  const Component = motion[as];

  return (
    <Component
      className={`surface-card group relative overflow-hidden rounded-2xl transition-colors duration-500 hover:border-lime/35 ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      variants={revealUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportSoft}
      transition={{ delay }}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: glare }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative z-10 h-full">{children}</div>
    </Component>
  );
}
