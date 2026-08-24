"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Partículas de fundo — deliberadamente quase invisíveis.
 *
 * Só existem em ponteiro fino, sem movimento reduzido, e param quando a aba
 * sai de foco. Um canvas fixo atrás de tudo, sem custo de layout.
 */
export function Particles({ count = 46 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const dots = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: Math.random() * 1.1 + 0.35,
      speed: Math.random() * 0.00008 + 0.00002,
      drift: (Math.random() - 0.5) * 0.00004,
      alpha: Math.random() * 0.22 + 0.05,
    }));

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    const render = () => {
      if (!running) return;
      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const dot of dots) {
        dot.y -= dot.speed;
        dot.x += dot.drift;
        if (dot.y < -0.02) dot.y = 1.02;
        if (dot.x < -0.02) dot.x = 1.02;
        if (dot.x > 1.02) dot.x = -0.02;

        context.beginPath();
        context.arc(
          dot.x * canvas.width,
          dot.y * canvas.height,
          dot.radius * dpr,
          0,
          Math.PI * 2,
        );
        context.fillStyle = `rgba(183, 255, 0, ${dot.alpha})`;
        context.fill();
      }

      frame = requestAnimationFrame(render);
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) {
        frame = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(frame);
      }
    };

    resize();
    render();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 hidden lg:block"
    />
  );
}
