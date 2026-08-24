"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { useCallback } from "react";

type Variant = "primary" | "ghost" | "outline";

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  ariaLabel?: string;
  strength?: number;
};

const base =
  "group relative inline-flex items-center justify-center gap-2.5 rounded-full text-sm font-semibold tracking-wide transition-colors duration-300 will-change-transform";

const variants: Record<Variant, string> = {
  primary: "bg-lime text-ink px-7 py-3.5 hover:bg-lime-bright",
  outline:
    "border border-hairline-strong text-white px-7 py-3.5 hover:border-lime/60 hover:text-lime",
  ghost: "text-white px-4 py-2 hover:text-lime",
};

/**
 * Botão magnético: acompanha o cursor de leve dentro do próprio raio.
 * Em toque e sob prefers-reduced-motion, é apenas um botão.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  ariaLabel,
  strength = 0.28,
}: MagneticButtonProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.5 });

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (reduceMotion || event.pointerType !== "mouse") return;
      const rect = event.currentTarget.getBoundingClientRect();
      x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
      y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
    },
    [reduceMotion, strength, x, y],
  );

  const reset = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const content = (
    <>
      {variant === "primary" ? (
        <span
          aria-hidden="true"
          className="bg-lime/40 absolute inset-0 -z-10 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
        />
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-2.5">{children}</span>
    </>
  );

  const sharedProps = {
    className: `${base} ${variants[variant]} ${className}`,
    style: { x: springX, y: springY },
    onPointerMove,
    onPointerLeave: reset,
    "aria-label": ariaLabel,
  };

  if (href) {
    return (
      <motion.a href={href} {...sharedProps}>
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button type="button" onClick={onClick} {...sharedProps}>
      {content}
    </motion.button>
  );
}
