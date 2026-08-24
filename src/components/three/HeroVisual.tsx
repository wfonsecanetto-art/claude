"use client";

import { useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ValorObjectFallback } from "./ValorObjectFallback";

/** A cena WebGL nunca entra no bundle inicial. */
const ValorScene = dynamic(() => import("./ValorScene"), {
  ssr: false,
  loading: () => <ValorObjectFallback />,
});

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

/**
 * Decide entre a cena 3D e a alternativa leve.
 *
 * WebGL só é carregado em telas grandes, com ponteiro fino e suporte real —
 * no celular o Hero usa a composição SVG, como pede a regra de performance.
 */
export function HeroVisual() {
  const reduceMotion = useReducedMotion();
  const [use3D, setUse3D] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const evaluate = () => setUse3D(query.matches && supportsWebGL());

    evaluate();
    query.addEventListener("change", evaluate);
    return () => query.removeEventListener("change", evaluate);
  }, []);

  if (!use3D) return <ValorObjectFallback />;

  return (
    <div
      className="h-full w-full"
      role="img"
      aria-label="Objeto tridimensional abstrato da marca Valor, com núcleo metálico e órbitas em verde-limão."
    >
      <ValorScene reduceMotion={Boolean(reduceMotion)} />
    </div>
  );
}
