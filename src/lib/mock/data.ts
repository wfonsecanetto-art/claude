import type {
  ContractSummary,
  CreditOffer,
  CreditPosition,
  ValorScore,
} from "./types";

/**
 * Dados de demonstração usados nos mockups de interface.
 * Nenhum valor abaixo corresponde a conta, contrato ou operação real.
 */

export const demoScore: ValorScore = {
  points: 847,
  max: 1000,
  level: "Diamante",
  delta: 42,
  source: "demo",
};

export const demoPosition: CreditPosition = {
  limitTotal: 12000,
  limitUsed: 4350,
  outstandingBalance: 3180.4,
  installmentToday: 265.03,
  nextDueDate: "12/09",
  cashbackAccrued: 187.5,
  currency: "BRL",
  source: "demo",
};

export const demoContracts: ContractSummary[] = [
  {
    id: "VLR-0042",
    status: "Ativo",
    principal: 4350,
    installments: "8 de 18",
    openedAt: "03/2026",
    source: "demo",
  },
  {
    id: "VLR-0031",
    status: "Quitado",
    principal: 2200,
    installments: "12 de 12",
    openedAt: "07/2025",
    source: "demo",
  },
  {
    id: "VLR-0027",
    status: "Quitado",
    principal: 1500,
    installments: "6 de 6",
    openedAt: "01/2025",
    source: "demo",
  },
];

export const demoOffers: CreditOffer[] = [
  {
    id: "OF-01",
    title: "Aumento de limite",
    description: "Revisão de limite liberada pelo nível atual.",
    requiresLevel: "Ouro",
    source: "demo",
  },
  {
    id: "OF-02",
    title: "Antecipação de parcelas",
    description: "Abatimento proporcional ao quitar antes do vencimento.",
    requiresLevel: "Prata",
    source: "demo",
  },
];

/** Série do gráfico de evolução do score (12 pontos, demonstrativa). */
export const demoScoreHistory = [312, 358, 401, 447, 505, 548, 602, 661, 707, 762, 806, 847];

/** Formatação monetária pt-BR sem depender do locale do navegador. */
export function formatBRL(value: number, withCents = true): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  }).format(value);
}
