type BackdropProps = {
  /** Intensidade do brilho verde ao fundo. */
  glow?: "none" | "soft" | "strong";
  grid?: boolean;
  className?: string;
};

/**
 * Fundo compartilhado das seções: grid editorial tênue + halo verde-limão.
 * Puramente decorativo — sempre fora da árvore de acessibilidade.
 */
export function Backdrop({ glow = "soft", grid = true, className = "" }: BackdropProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      {grid ? (
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.16) 1px, transparent 1px)",
            backgroundSize: "clamp(64px, 8vw, 120px) clamp(64px, 8vw, 120px)",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 80%)",
          }}
        />
      ) : null}

      {glow !== "none" ? (
        <div
          className={`valor-glow-pulse absolute top-1/2 left-1/2 h-[56vmax] w-[56vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] ${
            glow === "strong" ? "bg-lime/[0.07]" : "bg-lime/[0.035]"
          }`}
        />
      ) : null}
    </div>
  );
}
