type DemoBadgeProps = {
  className?: string;
  label?: string;
};

/**
 * Selo obrigatório em qualquer número exibido nas telas do piloto.
 * Nenhum dado aqui é real — e a interface precisa dizer isso.
 */
export function DemoBadge({ className = "", label = "Dados de demonstração" }: DemoBadgeProps) {
  return (
    <span
      className={`border-lime/30 bg-lime/10 text-lime inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.18em] uppercase ${className}`}
    >
      <span className="bg-lime h-1 w-1 rounded-full" aria-hidden="true" />
      {label}
    </span>
  );
}
