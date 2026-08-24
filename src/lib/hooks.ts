"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/** Verdadeiro assim que a página sai do topo — usado pelo header. */
export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

/**
 * Posição do ponteiro normalizada em [-1, 1], suavizada por spring.
 * Em telas de toque (ou com movimento reduzido) permanece em repouso.
 */
export function usePointerParallax(strength = 1) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 60, damping: 18, mass: 0.7 });
  const springY = useSpring(y, { stiffness: 60, damping: 18, mass: 0.7 });

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const nx = (event.clientX / window.innerWidth) * 2 - 1;
        const ny = (event.clientY / window.innerHeight) * 2 - 1;
        x.set(nx * strength);
        y.set(ny * strength);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reduceMotion, strength, x, y]);

  return { x: springX, y: springY };
}

/** Dispara uma única vez quando o elemento entra na viewport. */
export function useInViewOnce<T extends HTMLElement>(amount = 0.4) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: amount },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [amount, inView]);

  return { ref, inView };
}

/** Contagem progressiva com ease-out; respeita prefers-reduced-motion. */
export function useCountUp(target: number, active: boolean, duration = 1600) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, reduceMotion, target]);

  return value;
}

/** Tilt 3D leve, calculado a partir do cursor sobre o próprio card. */
export function useCardTilt(maxDeg = 6) {
  const reduceMotion = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springConfig = { stiffness: 150, damping: 18, mass: 0.6 };
  const smoothX = useSpring(rotateX, springConfig);
  const smoothY = useSpring(rotateY, springConfig);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (reduceMotion || event.pointerType !== "mouse") return;
      const rect = event.currentTarget.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      rotateY.set((px - 0.5) * maxDeg * 2);
      rotateX.set((0.5 - py) * maxDeg * 2);
      glareX.set(px * 100);
      glareY.set(py * 100);
    },
    [glareX, glareY, maxDeg, reduceMotion, rotateX, rotateY],
  );

  const onPointerLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
  }, [glareX, glareY, rotateX, rotateY]);

  return { rotateX: smoothX, rotateY: smoothY, glareX, glareY, onPointerMove, onPointerLeave };
}
