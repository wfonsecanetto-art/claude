import type { Cents } from "../money";
import type { ScoreLevel } from "./score";
import {
  AUTO_APPROVAL_MIN_SCORE,
  AUTO_REJECTION_MAX_SCORE,
  LEVEL_POLICY,
  MAX_INCOME_COMMITMENT,
  MIN_AMOUNT_CENTS,
} from "./rates";

/**
 * Política de crédito: quanto, a que taxa e sob quais condições.
 *
 * Separada do cálculo financeiro de propósito — a matemática do contrato é
 * estável, a política muda com apetite de risco e regulação.
 */

export type LimitAssessment = {
  /** Teto do nível de relacionamento. */
  levelLimitCents: Cents;
  /** Teto derivado do comprometimento de renda. */
  incomeLimitCents: Cents;
  /** Menor entre os dois, já descontado o que está em uso. */
  approvedLimitCents: Cents;
  usedCents: Cents;
  availableCents: Cents;
  monthlyRateBps: number;
};

export function assessLimit(params: {
  level: ScoreLevel;
  monthlyIncomeCents: Cents;
  outstandingCents: Cents;
}): LimitAssessment {
  const policy = LEVEL_POLICY[params.level];
  // Regra de bolso: a renda sustenta uma carteira de até 12 parcelas dentro do
  // comprometimento máximo. É deliberadamente conservador.
  const incomeLimit = Math.round(params.monthlyIncomeCents * MAX_INCOME_COMMITMENT * 12);
  const approved = Math.min(policy.limitCents, incomeLimit);

  return {
    levelLimitCents: policy.limitCents,
    incomeLimitCents: incomeLimit,
    approvedLimitCents: approved,
    usedCents: params.outstandingCents,
    availableCents: Math.max(approved - params.outstandingCents, 0),
    monthlyRateBps: policy.monthlyRateBps,
  };
}

export type DecisionOutcome = "APPROVED" | "UNDER_REVIEW" | "REJECTED";

export type Decision = {
  outcome: DecisionOutcome;
  reason: string;
  checks: { key: string; label: string; passed: boolean; detail: string }[];
};

export function decide(params: {
  score: number;
  kycApproved: boolean;
  amountCents: Cents;
  installmentCents: Cents;
  monthlyIncomeCents: Cents;
  availableLimitCents: Cents;
  installmentsCurrentlyLate: number;
}): Decision {
  const commitment =
    params.monthlyIncomeCents > 0 ? params.installmentCents / params.monthlyIncomeCents : 1;

  const checks = [
    {
      key: "kyc",
      label: "Cadastro verificado",
      passed: params.kycApproved,
      detail: params.kycApproved
        ? "Identidade confirmada."
        : "Verificação de identidade pendente.",
    },
    {
      key: "amount",
      label: "Valor dentro do limite",
      passed: params.amountCents <= params.availableLimitCents && params.amountCents >= MIN_AMOUNT_CENTS,
      detail: `Solicitado dentro do limite disponível de ${(params.availableLimitCents / 100).toFixed(2)}.`,
    },
    {
      key: "commitment",
      label: "Comprometimento de renda",
      passed: commitment <= MAX_INCOME_COMMITMENT,
      detail: `Parcela representa ${Math.round(commitment * 100)}% da renda declarada (limite ${Math.round(MAX_INCOME_COMMITMENT * 100)}%).`,
    },
    {
      key: "delinquency",
      label: "Sem parcelas em atraso",
      passed: params.installmentsCurrentlyLate === 0,
      detail:
        params.installmentsCurrentlyLate === 0
          ? "Nenhuma parcela vencida em aberto."
          : `${params.installmentsCurrentlyLate} parcelas em atraso.`,
    },
    {
      key: "score",
      label: "Score mínimo",
      passed: params.score >= AUTO_APPROVAL_MIN_SCORE,
      detail: `Score ${params.score} (mínimo ${AUTO_APPROVAL_MIN_SCORE} para decisão automática).`,
    },
  ];

  const blocking = checks.filter(
    (check) => !check.passed && check.key !== "score",
  );

  if (params.score <= AUTO_REJECTION_MAX_SCORE) {
    return {
      outcome: "REJECTED",
      reason: `Score ${params.score} abaixo do mínimo aceito pela política de crédito.`,
      checks,
    };
  }

  if (blocking.length > 0) {
    return {
      outcome: "REJECTED",
      reason: blocking.map((check) => check.detail).join(" "),
      checks,
    };
  }

  if (params.score < AUTO_APPROVAL_MIN_SCORE) {
    return {
      outcome: "UNDER_REVIEW",
      reason: `Score ${params.score} exige análise manual antes da aprovação.`,
      checks,
    };
  }

  return {
    outcome: "APPROVED",
    reason: "Todos os critérios da política de crédito foram atendidos.",
    checks,
  };
}
