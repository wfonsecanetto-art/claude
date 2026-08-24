type LogoProps = {
  className?: string;
  /** Sinaliza o piloto ao lado da marca. */
  withMark?: boolean;
};

/** Marca VALOR: wordmark tipográfico com um acento que fecha o "R". */
export function Logo({ className = "", withMark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-display text-[1.15rem] leading-none font-extrabold tracking-[0.18em] text-white uppercase">
        Valor
      </span>
      {withMark ? (
        <span className="bg-lime mb-[2px] inline-block h-1.5 w-1.5 rounded-[1px]" aria-hidden="true" />
      ) : null}
    </span>
  );
}
