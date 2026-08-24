import { describe, expect, it } from "vitest";
import { calculateScore, levelForPoints } from "../score";
import { assessLimit, decide } from "../policy";

const baseInput = {
  kycApproved: false,
  relationshipMonths: 0,
  installmentsPaidOnTime: 0,
  installmentsPaidLate: 0,
  installmentsCurrentlyLate: 0,
  contractsSettled: 0,
  limitUsage: 0,
  hasProofOfIncome: false,
  declaredIncomeCents: 0,
};

describe("Score Valor", () => {
  it("mantém a pontuação dentro de 0 a 1.000", () => {
    const excellent = calculateScore({
      ...baseInput,
      kycApproved: true,
      relationshipMonths: 120,
      installmentsPaidOnTime: 100,
      contractsSettled: 20,
      hasProofOfIncome: true,
    });
    expect(excellent.points).toBeLessThanOrEqual(1000);

    const terrible = calculateScore({
      ...baseInput,
      installmentsPaidLate: 50,
      installmentsCurrentlyLate: 50,
      limitUsage: 1,
    });
    expect(terrible.points).toBeGreaterThanOrEqual(0);
  });

  it("penaliza atraso corrente mais do que atraso já quitado", () => {
    const late = calculateScore({ ...baseInput, installmentsCurrentlyLate: 1 });
    const paidLate = calculateScore({ ...baseInput, installmentsPaidLate: 1 });
    expect(late.points).toBeLessThan(paidLate.points);
  });

  it("explica cada ponto atribuído", () => {
    const result = calculateScore({ ...baseInput, kycApproved: true });
    const total = result.factors.reduce((sum, factor) => sum + factor.points, 0);
    expect(total).toBe(result.points);
  });

  it("mapeia faixas para os níveis do produto", () => {
    expect(levelForPoints(0)).toBe("Bronze");
    expect(levelForPoints(299)).toBe("Bronze");
    expect(levelForPoints(300)).toBe("Prata");
    expect(levelForPoints(847)).toBe("Diamante");
    expect(levelForPoints(1000)).toBe("Black");
  });
});

describe("Política de limite", () => {
  it("usa o menor entre o teto do nível e o teto por renda", () => {
    const lowIncome = assessLimit({
      level: "Black",
      monthlyIncomeCents: 200_000,
      outstandingCents: 0,
    });
    // 30% de 2.000,00 por 12 meses = 7.200,00, bem abaixo do teto Black.
    expect(lowIncome.approvedLimitCents).toBe(720_000);
  });

  it("desconta o saldo devedor do limite disponível", () => {
    const used = assessLimit({
      level: "Ouro",
      monthlyIncomeCents: 1_000_000,
      outstandingCents: 200_000,
    });
    expect(used.availableCents).toBe(used.approvedLimitCents - 200_000);
  });

  it("nunca devolve limite disponível negativo", () => {
    const over = assessLimit({
      level: "Bronze",
      monthlyIncomeCents: 100_000,
      outstandingCents: 999_999_99,
    });
    expect(over.availableCents).toBe(0);
  });
});

describe("Decisão de crédito", () => {
  const approvable = {
    score: 600,
    kycApproved: true,
    amountCents: 200_000,
    installmentCents: 20_000,
    monthlyIncomeCents: 400_000,
    availableLimitCents: 500_000,
    installmentsCurrentlyLate: 0,
  };

  it("aprova quando todos os critérios passam", () => {
    expect(decide(approvable).outcome).toBe("APPROVED");
  });

  it("recusa acima do comprometimento de renda", () => {
    const result = decide({ ...approvable, installmentCents: 200_000 });
    expect(result.outcome).toBe("REJECTED");
    expect(result.reason).toContain("renda");
  });

  it("recusa com parcela em atraso", () => {
    expect(decide({ ...approvable, installmentsCurrentlyLate: 2 }).outcome).toBe("REJECTED");
  });

  it("encaminha para análise manual em score intermediário", () => {
    expect(decide({ ...approvable, score: 275 }).outcome).toBe("UNDER_REVIEW");
  });

  it("recusa automaticamente score muito baixo", () => {
    expect(decide({ ...approvable, score: 100 }).outcome).toBe("REJECTED");
  });

  it("bloqueia sem verificação de identidade", () => {
    expect(decide({ ...approvable, kycApproved: false }).outcome).toBe("REJECTED");
  });
});
