import type { Transition, Variants } from "framer-motion";

/**
 * Presets de movimento do Banco Valor Digital.
 *
 * Regras da casa: ease-out ou spring suave, duração entre 400ms e 1000ms,
 * e nenhuma animação que mexa em propriedades de layout (só transform/opacity/filter).
 */

export const EASE_VALOR = [0.16, 1, 0.3, 1] as const;

export const softSpring: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 0.9,
};

export const easeOut = (duration = 0.7, delay = 0): Transition => ({
  duration,
  delay,
  ease: EASE_VALOR,
});

/** Entrada padrão: sobe, revela e ganha nitidez. */
export const revealUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: easeOut(0.8),
  },
};

export const revealFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeOut(0.9) },
};

export const revealScale: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 40, filter: "blur(14px)" },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: easeOut(1),
  },
};

/** Contêiner que escalona a entrada dos filhos. */
export const stagger = (staggerChildren = 0.09, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

/** Palavra a palavra, para títulos editoriais. */
export const wordReveal: Variants = {
  hidden: { opacity: 0, y: "0.5em", filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: "0em",
    filter: "blur(0px)",
    transition: easeOut(0.9),
  },
};

/** Uma linha que se desenha da esquerda para a direita. */
export const drawLine: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: easeOut(0.9),
  },
};

/** Configuração de viewport reutilizada em todas as seções. */
export const viewportOnce = { once: true, amount: 0.25 } as const;
export const viewportSoft = { once: true, amount: 0.15 } as const;
