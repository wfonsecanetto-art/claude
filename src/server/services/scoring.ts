import { db } from "../db";
import {
  LEVEL_RANGES,
  SCORE_LEVELS,
  calculateScore,
  levelForPoints,
  type ScoreResult,
} from "../credit/score";
import { assessLimit, type LimitAssessment } from "../credit/policy";

/**
 * Recalcula o Score Valor a partir dos eventos reais do cliente.
 *
 * Chamado depois de todo evento que muda o histórico: KYC aprovado, contrato
 * assinado, parcela paga, contrato quitado. O snapshot só é gravado quando a
 * pontuação muda — o histórico serve para mostrar evolução, não para registrar
 * recálculos idênticos.
 */
export async function recalculateScore(userId: string, reason: string): Promise<ScoreResult> {
  const [user, kyc, contracts, latestSnapshot] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.kycProfile.findUnique({ where: { userId } }),
    db.contract.findMany({ where: { userId }, include: { installments: true } }),
    db.scoreSnapshot.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  const now = new Date();
  const installments = contracts.flatMap((contract) => contract.installments);

  const paidOnTime = installments.filter(
    (item) => item.status === "PAID" && item.paidAt && item.paidAt <= item.dueDate,
  ).length;
  const paidLate = installments.filter(
    (item) => item.status === "PAID" && item.paidAt && item.paidAt > item.dueDate,
  ).length;
  const currentlyLate = installments.filter(
    (item) => item.status !== "PAID" && item.dueDate < now,
  ).length;

  const settledContracts = contracts.filter((contract) => contract.status === "SETTLED").length;

  const outstanding = contracts
    .filter((contract) => contract.status === "ACTIVE")
    .reduce(
      (sum, contract) =>
        sum +
        contract.installments
          .filter((item) => item.status !== "PAID")
          .reduce((inner, item) => inner + (item.totalCents - item.paidCents), 0),
      0,
    );

  const incomeCents = kyc?.monthlyIncomeCents ?? 0;
  const hasProofOfIncome = await db.document.count({
    where: { userId, type: "PROOF_OF_INCOME", status: "APPROVED" },
  });

  const relationshipMonths = Math.max(
    0,
    Math.floor((now.getTime() - user.createdAt.getTime()) / (30 * 86_400_000)),
  );

  const baseInput = {
    kycApproved: kyc?.status === "APPROVED",
    relationshipMonths,
    installmentsPaidOnTime: paidOnTime,
    installmentsPaidLate: paidLate,
    installmentsCurrentlyLate: currentlyLate,
    contractsSettled: settledContracts,
    hasProofOfIncome: hasProofOfIncome > 0,
    declaredIncomeCents: incomeCents,
  };

  // O limite depende do nível e o nível depende do score, que por sua vez
  // considera a utilização do limite. Resolve-se em duas passagens: a primeira
  // ignora a utilização e define o nível; a segunda mede a utilização contra o
  // limite desse nível. Usar o snapshot anterior faria o percentual exibido
  // divergir do limite que o cliente vê na tela.
  const provisional = calculateScore({ ...baseInput, limitUsage: 0 });
  const provisionalLimit = assessLimit({
    level: provisional.level,
    monthlyIncomeCents: incomeCents,
    outstandingCents: outstanding,
  });

  const result = calculateScore({
    ...baseInput,
    limitUsage:
      provisionalLimit.approvedLimitCents > 0
        ? Math.min(outstanding / provisionalLimit.approvedLimitCents, 1)
        : 0,
  });

  if (!latestSnapshot || latestSnapshot.points !== result.points) {
    await db.scoreSnapshot.create({
      data: {
        userId,
        points: result.points,
        level: result.level,
        factors: JSON.stringify(result.factors),
        reason,
      },
    });
  }

  return result;
}

/** Score atual sem recalcular; recalcula apenas se o cliente ainda não tem um. */
export async function currentScore(userId: string): Promise<ScoreResult> {
  const snapshot = await db.scoreSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!snapshot) return recalculateScore(userId, "Primeira apuração");

  return {
    points: snapshot.points,
    level: levelForPoints(snapshot.points),
    factors: JSON.parse(snapshot.factors),
    ...nextLevelInfo(snapshot.points),
  };
}

function nextLevelInfo(points: number) {
  const level = levelForPoints(points);
  const index = SCORE_LEVELS.indexOf(level);
  const nextLevel = index < SCORE_LEVELS.length - 1 ? SCORE_LEVELS[index + 1] : null;

  return {
    nextLevel,
    pointsToNextLevel: nextLevel ? LEVEL_RANGES[nextLevel].min - points : null,
  };
}

/** Posição de crédito consolidada do cliente. */
export async function creditPosition(userId: string): Promise<{
  score: ScoreResult;
  limit: LimitAssessment;
  outstandingCents: number;
}> {
  const [score, kyc, contracts] = await Promise.all([
    currentScore(userId),
    db.kycProfile.findUnique({ where: { userId } }),
    db.contract.findMany({ where: { userId, status: "ACTIVE" }, include: { installments: true } }),
  ]);

  const outstanding = contracts.reduce(
    (sum, contract) =>
      sum +
      contract.installments
        .filter((item) => item.status !== "PAID")
        .reduce((inner, item) => inner + (item.totalCents - item.paidCents), 0),
    0,
  );

  const limit = assessLimit({
    level: score.level,
    monthlyIncomeCents: kyc?.monthlyIncomeCents ?? 0,
    outstandingCents: outstanding,
  });

  return { score, limit, outstandingCents: outstanding };
}
