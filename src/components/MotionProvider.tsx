"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Ajuste global de movimento.
 *
 * `reducedMotion="user"` faz o Framer Motion respeitar a preferência do sistema:
 * transformações são suprimidas e só a opacidade continua animando.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
