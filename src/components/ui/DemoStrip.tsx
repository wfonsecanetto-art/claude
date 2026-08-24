const ITEMS = [
  "Projeto piloto",
  "Dados de demonstração",
  "Sem integrações bancárias",
  "Interfaces preparadas para evolução",
  "Banco Valor Digital",
];

/**
 * Faixa editorial em movimento contínuo.
 * Além do papel gráfico, é o aviso permanente de que o piloto não opera de verdade.
 */
export function DemoStrip() {
  const sequence = [...ITEMS, ...ITEMS];

  return (
    <div className="border-hairline relative overflow-hidden border-y py-4" role="note">
      <p className="sr-only">
        Projeto piloto com dados de demonstração e sem integrações bancárias.
      </p>
      <div className="valor-marquee flex w-max items-center gap-10" aria-hidden="true">
        {sequence.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-10">
            <span className="font-display text-gray-valor text-xs font-extrabold tracking-[0.24em] whitespace-nowrap uppercase">
              {item}
            </span>
            <span className="bg-lime h-1 w-1 shrink-0 rounded-full" />
          </span>
        ))}
      </div>
    </div>
  );
}
