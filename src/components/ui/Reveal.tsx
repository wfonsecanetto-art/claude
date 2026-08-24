"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { revealUp, viewportSoft } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "header" | "footer";
};

/** Entrada padrão de bloco: sobe, revela e ganha nitidez — uma única vez. */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const Component = motion[as];

  return (
    <Component
      className={className}
      variants={revealUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportSoft}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}
