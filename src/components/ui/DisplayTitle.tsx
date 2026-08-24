"use client";

import { motion } from "framer-motion";
import { stagger, viewportSoft, wordReveal } from "@/lib/motion";

type DisplayTitleProps = {
  /** Cada string vira uma linha; a linha ganha destaque quando `accentLines` a inclui. */
  lines: string[];
  accentLines?: number[];
  className?: string;
  as?: "h1" | "h2" | "h3";
  id?: string;
};

/**
 * Título editorial gigante, revelado palavra a palavra.
 *
 * O texto completo permanece legível para leitores de tela: o `aria-label`
 * carrega a frase inteira e os fragmentos animados ficam ocultos da AT.
 */
export function DisplayTitle({
  lines,
  accentLines = [],
  className = "",
  as = "h2",
  id,
}: DisplayTitleProps) {
  const Heading = motion[as];
  const label = lines.join(" ");

  return (
    <Heading
      id={id}
      aria-label={label}
      className={`display ${className}`}
      variants={stagger(0.08)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportSoft}
    >
      {/* Sem máscara de overflow: ela cortava acentos e a cauda do Q. */}
      {lines.map((line, lineIndex) => (
        <span key={line} className="block pt-[0.04em] pb-[0.1em]">
          <span
            aria-hidden="true"
            className={
              accentLines.includes(lineIndex) ? "text-lime text-glow-lime" : undefined
            }
          >
            {line.split(" ").map((word, wordIndex) => (
              <motion.span
                key={`${word}-${wordIndex}`}
                variants={wordReveal}
                className="inline-block will-change-transform"
              >
                {word}
                {wordIndex < line.split(" ").length - 1 ? " " : ""}
              </motion.span>
            ))}
          </span>
        </span>
      ))}
    </Heading>
  );
}
