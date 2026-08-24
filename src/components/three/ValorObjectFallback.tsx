/**
 * Alternativa sem WebGL ao objeto 3D do Hero.
 *
 * Usada em telas pequenas e em navegadores sem WebGL: mesma leitura visual
 * (núcleo metálico, casca luminosa, órbitas), custo próximo de zero.
 */
export function ValorObjectFallback() {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      role="img"
      aria-label="Representação abstrata da marca Valor: um núcleo metálico envolvido por órbitas em verde-limão."
    >
      <div className="bg-lime/12 absolute h-[62%] w-[62%] rounded-full blur-[70px]" aria-hidden="true" />

      <svg
        viewBox="0 0 400 400"
        className="relative h-full w-full max-h-[420px] max-w-[420px]"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="valor-core" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#3d4443" />
            <stop offset="45%" stopColor="#141817" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
          <linearGradient id="valor-rim" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#b7ff00" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#b7ff00" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#b7ff00" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="valor-orbit-slow" style={{ transformOrigin: "200px 200px" }}>
          <ellipse
            cx="200"
            cy="200"
            rx="168"
            ry="62"
            fill="none"
            stroke="#b7ff00"
            strokeOpacity="0.5"
            strokeWidth="1"
            transform="rotate(-18 200 200)"
          />
          <circle cx="360" cy="152" r="4" fill="#b7ff00" />
        </g>

        <ellipse
          cx="200"
          cy="200"
          rx="190"
          ry="78"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.12"
          strokeWidth="1"
          transform="rotate(24 200 200)"
        />

        <circle cx="200" cy="200" r="112" fill="url(#valor-core)" />
        <circle cx="200" cy="200" r="112" fill="none" stroke="url(#valor-rim)" strokeWidth="2" />

        <g
          className="valor-orbit-reverse"
          style={{ transformOrigin: "200px 200px" }}
          stroke="#b7ff00"
          strokeOpacity="0.24"
          strokeWidth="0.75"
          fill="none"
        >
          <circle cx="200" cy="200" r="140" strokeDasharray="3 10" />
          <path d="M60 200 L340 200" strokeOpacity="0.12" />
          <path d="M200 60 L200 340" strokeOpacity="0.12" />
        </g>
      </svg>
    </div>
  );
}
