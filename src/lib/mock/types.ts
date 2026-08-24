/** Contratos de dados da plataforma. A UI só conhece estes tipos. */

export type DataSource = "demo" | "live";

export type ScoreLevel = "Bronze" | "Prata" | "Ouro" | "Diamante" | "Black";

export interface ValorScore {
  /** 0 a 1.000 pontos. */
  points: number;
  max: number;
  level: ScoreLevel;
  /** Variação em pontos no último ciclo. */
  delta: number;
  source: DataSource;
}

export interface CreditPosition {
  limitTotal: number;
  limitUsed: number;
  outstandingBalance: number;
  installmentToday: number;
  nextDueDate: string;
  cashbackAccrued: number;
  currency: "BRL";
  source: DataSource;
}

export interface ContractSummary {
  id: string;
  status: "Ativo" | "Quitado" | "Em análise";
  principal: number;
  installments: string;
  openedAt: string;
  source: DataSource;
}

export interface CreditOffer {
  id: string;
  title: string;
  description: string;
  requiresLevel: ScoreLevel;
  source: DataSource;
}

/**
 * Fronteira de integração.
 *
 * Hoje existe uma única implementação — a mock. Uma implementação real
 * (HTTP/REST contra o back-end NestJS) deve satisfazer esta mesma interface.
 */
export interface ValorPlatformClient {
  readonly source: DataSource;
  getScore(): Promise<ValorScore>;
  getCreditPosition(): Promise<CreditPosition>;
  listContracts(): Promise<ContractSummary[]>;
  listOffers(): Promise<CreditOffer[]>;
}
