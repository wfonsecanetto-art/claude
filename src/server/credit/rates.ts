/**
 * Parâmetros da política de crédito.
 *
 * ATENÇÃO: estes números são parâmetros de configuração do piloto, não uma
 * oferta. Taxas, limites e comprometimento de renda precisam ser definidos e
 * homologados pela área de crédito e pelo jurídico antes de qualquer operação
 * real, observando a regulação aplicável (transparência de CET, IOF, SCR).
 */

import type { ScoreLevel } from "./score";

/** Alíquotas de IOF para crédito a pessoa física. Confirme antes de operar. */
export const IOF = {
  /** IOF adicional, cobrado uma vez sobre o valor da operação. */
  fixedRate: 0.0038,
  /** IOF diário sobre cada parcela de principal. */
  dailyRate: 0.000082,
  /** O IOF diário é limitado a 365 dias de prazo. */
  maxDays: 365,
} as const;

export type LevelPolicy = {
  /** Taxa de juros mensal em basis points. 590 = 5,90% a.m. */
  monthlyRateBps: number;
  /** Teto de crédito do nível, em centavos. */
  limitCents: number;
  /** Percentual do cashback sobre os juros pagos, quando há quitação integral. */
  cashbackOnInterestBps: number;
};

export const LEVEL_POLICY: Record<ScoreLevel, LevelPolicy> = {
  Bronze: { monthlyRateBps: 690, limitCents: 100_000, cashbackOnInterestBps: 200 },
  Prata: { monthlyRateBps: 590, limitCents: 300_000, cashbackOnInterestBps: 300 },
  Ouro: { monthlyRateBps: 490, limitCents: 600_000, cashbackOnInterestBps: 500 },
  Diamante: { monthlyRateBps: 390, limitCents: 1_200_000, cashbackOnInterestBps: 700 },
  Black: { monthlyRateBps: 290, limitCents: 2_500_000, cashbackOnInterestBps: 1000 },
};

/** Comprometimento máximo da renda mensal declarada com a parcela. */
export const MAX_INCOME_COMMITMENT = 0.3;

/** Prazos ofertados, em meses. */
export const AVAILABLE_TERMS = [3, 6, 9, 12, 18, 24] as const;

export const MIN_AMOUNT_CENTS = 30_000;

/** Score mínimo para decisão automática favorável. */
export const AUTO_APPROVAL_MIN_SCORE = 300;
/** Abaixo disto, a proposta é recusada sem passar por análise manual. */
export const AUTO_REJECTION_MAX_SCORE = 249;

/** Dias de atraso a partir dos quais o contrato entra em inadimplência. */
export const DEFAULT_AFTER_DAYS = 90;
