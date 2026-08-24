import type { Cents } from "../money";

/**
 * Score Valor — 0 a 1.000 pontos.
 *
 * Regras determinísticas e explicáveis: cada ponto atribuído tem um fator
 * nomeado e um peso visível. Decisão de crédito precisa ser justificável para
 * o cliente e auditável depois; caixa-preta não serve.
 */

export const SCORE_LEVELS = ["Bronze", "Prata", "Ouro", "Diamante", "Black"] as const;
export type ScoreLevel = (typeof SCORE_LEVELS)[number];

export const LEVEL_RANGES: Record<ScoreLevel, { min: number; max: number }> = {
  Bronze: { min: 0, max: 299 },
  Prata: { min: 300, max: 549 },
  Ouro: { min: 550, max: 749 },
  Diamante: { min: 750, max: 899 },
  Black: { min: 900, max: 1000 },
};

export const SCORE_MAX = 1000;
const SCORE_BASE = 280;

export type ScoreFactor = {
  key: string;
  label: string;
  points: number;
  detail: string;
};

export type ScoreInput = {
  kycApproved: boolean;
  /** Meses desde a criação da conta. */
  relationshipMonths: number;
  installmentsPaidOnTime: number;
  installmentsPaidLate: number;
  installmentsCurrentlyLate: number;
  contractsSettled: number;
  /** Limite utilizado sobre limite total, de 0 a 1. */
  limitUsage: number;
  hasProofOfIncome: boolean;
  declaredIncomeCents: Cents;
};

export type ScoreResult = {
  points: number;
  level: ScoreLevel;
  factors: ScoreFactor[];
  /** Pontos que faltam para o próximo nível, ou null no topo. */
  pointsToNextLevel: number | null;
  nextLevel: ScoreLevel | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function levelForPoints(points: number): ScoreLevel {
  const found = SCORE_LEVELS.find((level) => {
    const range = LEVEL_RANGES[level];
    return points >= range.min && points <= range.max;
  });
  return found ?? "Bronze";
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const factors: ScoreFactor[] = [
    {
      key: "base",
      label: "Pontuação inicial",
      points: SCORE_BASE,
      detail: "Todo cliente começa em 280 pontos.",
    },
  ];

  factors.push({
    key: "kyc",
    label: "Cadastro verificado",
    points: input.kycApproved ? 80 : 0,
    detail: input.kycApproved
      ? "Identidade e documentos aprovados."
      : "Conclua a verificação para somar 80 pontos.",
  });

  const relationship = clamp(input.relationshipMonths * 2, 0, 120);
  factors.push({
    key: "relationship",
    label: "Tempo de relacionamento",
    points: relationship,
    detail: `${input.relationshipMonths} ${input.relationshipMonths === 1 ? "mês" : "meses"} de conta (2 pontos por mês, máximo 120).`,
  });

  const onTime = clamp(input.installmentsPaidOnTime * 12, 0, 260);
  factors.push({
    key: "on_time",
    label: "Parcelas pagas em dia",
    points: onTime,
    detail: `${input.installmentsPaidOnTime} parcelas em dia (12 pontos cada, máximo 260).`,
  });

  const settled = clamp(input.contractsSettled * 60, 0, 180);
  factors.push({
    key: "settled",
    label: "Contratos quitados",
    points: settled,
    detail: `${input.contractsSettled} contratos quitados integralmente (60 pontos cada).`,
  });

  const late = -clamp(input.installmentsPaidLate * 20, 0, 150);
  if (late !== 0) {
    factors.push({
      key: "paid_late",
      label: "Parcelas pagas com atraso",
      points: late,
      detail: `${input.installmentsPaidLate} parcelas quitadas após o vencimento.`,
    });
  }

  const currentlyLate = -clamp(input.installmentsCurrentlyLate * 60, 0, 240);
  if (currentlyLate !== 0) {
    factors.push({
      key: "currently_late",
      label: "Parcelas em atraso",
      points: currentlyLate,
      detail: `${input.installmentsCurrentlyLate} parcelas vencidas e em aberto agora.`,
    });
  }

  const usagePoints = input.limitUsage <= 0.3 ? 40 : input.limitUsage <= 0.7 ? 10 : -30;
  factors.push({
    key: "usage",
    label: "Uso do limite",
    points: usagePoints,
    detail: `${Math.round(input.limitUsage * 100)}% do limite utilizado.`,
  });

  factors.push({
    key: "income",
    label: "Renda comprovada",
    points: input.hasProofOfIncome ? 30 : 0,
    detail: input.hasProofOfIncome
      ? "Comprovante de renda enviado e aprovado."
      : "Envie o comprovante de renda para somar 30 pontos.",
  });

  const raw = factors.reduce((sum, factor) => sum + factor.points, 0);
  const points = clamp(Math.round(raw), 0, SCORE_MAX);
  const level = levelForPoints(points);

  const currentIndex = SCORE_LEVELS.indexOf(level);
  const nextLevel = currentIndex < SCORE_LEVELS.length - 1 ? SCORE_LEVELS[currentIndex + 1] : null;

  return {
    points,
    level,
    factors,
    nextLevel,
    pointsToNextLevel: nextLevel ? LEVEL_RANGES[nextLevel].min - points : null,
  };
}
