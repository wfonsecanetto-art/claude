"use client";

import { motion } from "framer-motion";
import { useCountUp, useInViewOnce } from "@/lib/hooks";
import { viewportSoft } from "@/lib/motion";

type ScoreRingProps = {
  points: number;
  max: number;
  level: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  compact?: boolean;
};

/**
 * Indicador circular do Score Valor.
 *
 * O arco é desenhado por `pathLength`; o número acompanha em count-up.
 * O valor exibido é sempre de demonstração — o selo fica a cargo de quem usa.
 */
export function ScoreRing({
  points,
  max,
  level,
  size = 260,
  strokeWidth = 8,
  className = "",
  compact = false,
}: ScoreRingProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.4);
  const animated = useCountUp(points, inView, 1600);
  const ratio = points / max;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div ref={ref} className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`Score de demonstração: ${points} de ${max} pontos, nível ${level}.`}
      >
        <defs>
          <linearGradient id="score-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7fb300" />
            <stop offset="55%" stopColor="#b7ff00" />
            <stop offset="100%" stopColor="#d4ff4d" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#score-arc)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - ratio) }}
          viewport={viewportSoft}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: "drop-shadow(0 0 10px rgba(183,255,0,0.45))" }}
        />

        {/* Marcações da escala */}
        {Array.from({ length: 40 }).map((_, index) => {
          const angle = (index / 40) * Math.PI * 2;
          const inner = radius - strokeWidth - 6;
          const outer = inner - 5;
          return (
            <line
              key={index}
              x1={size / 2 + Math.cos(angle) * inner}
              y1={size / 2 + Math.sin(angle) * inner}
              x2={size / 2 + Math.cos(angle) * outer}
              y2={size / 2 + Math.sin(angle) * outer}
              stroke={index / 40 <= ratio ? "rgba(183,255,0,0.4)" : "rgba(255,255,255,0.09)"}
              strokeWidth="1"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="font-display text-white tabular-nums"
          style={{ fontSize: size * (compact ? 0.24 : 0.28), lineHeight: 1, letterSpacing: "-0.04em" }}
        >
          {Math.round(animated)}
        </span>
        <span className="eyebrow text-lime mt-2" style={{ fontSize: compact ? "0.55rem" : "0.6875rem" }}>
          {level}
        </span>
        {!compact ? (
          <span className="text-gray-valor mt-1 text-[0.625rem] tracking-[0.2em] uppercase">
            de {max.toLocaleString("pt-BR")} pontos
          </span>
        ) : null}
      </div>
    </div>
  );
}
