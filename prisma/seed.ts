import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";
import { quoteCredit } from "../src/server/credit/schedule";
import { LEVEL_POLICY } from "../src/server/credit/rates";

/**
 * Popula o ambiente local com dados coerentes: contas contábeis da
 * instituição, um analista e três clientes em estágios diferentes do funil.
 *
 * O histórico é construído com a mesma matemática do contrato real, e cada
 * movimentação tem lançamento contábil balanceado — o objetivo é um ambiente
 * onde os números fecham, não telas bonitas.
 */

const db = new PrismaClient();

const PLATFORM_ACCOUNTS = [
  { kind: "FUNDING", label: "Caixa de funding" },
  { kind: "RECEIVABLE", label: "Carteira de recebíveis" },
  { kind: "REVENUE", label: "Receitas e tributos" },
  { kind: "CASHBACK_POOL", label: "Provisão de cashback" },
];

const MINIMAL_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]>>endobj
trailer<</Root 1 0 R>>
%%EOF`;

async function platformAccount(kind: string) {
  const found = await db.account.findFirst({ where: { kind, userId: null } });
  if (found) return found;
  const meta = PLATFORM_ACCOUNTS.find((account) => account.kind === kind);
  return db.account.create({ data: { kind, label: meta?.label ?? kind } });
}

async function wallet(userId: string) {
  const found = await db.account.findFirst({ where: { kind: "WALLET", userId } });
  if (found) return found;
  return db.account.create({ data: { kind: "WALLET", userId, label: "Conta Valor" } });
}

async function post(params: {
  kind: string;
  description: string;
  reference?: string;
  createdAt: Date;
  entries: { accountId: string; direction: "DEBIT" | "CREDIT"; amountCents: number }[];
}) {
  const debits = params.entries
    .filter((entry) => entry.direction === "DEBIT")
    .reduce((sum, entry) => sum + entry.amountCents, 0);
  const credits = params.entries
    .filter((entry) => entry.direction === "CREDIT")
    .reduce((sum, entry) => sum + entry.amountCents, 0);
  if (debits !== credits) throw new Error(`Seed desbalanceado: ${params.description}`);

  return db.ledgerTransaction.create({
    data: {
      kind: params.kind,
      description: params.description,
      reference: params.reference,
      createdAt: params.createdAt,
      entries: {
        create: params.entries.map((entry) => ({ ...entry, createdAt: params.createdAt })),
      },
    },
  });
}

function monthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

async function createDocuments(userId: string) {
  const root = path.join(process.cwd(), "storage", "documents", userId);
  await mkdir(root, { recursive: true });

  for (const type of ["IDENTITY", "SELFIE", "PROOF_OF_ADDRESS"]) {
    const storageKey = `${userId}/${type.toLowerCase()}.pdf`;
    await writeFile(path.join(process.cwd(), "storage", "documents", storageKey), MINIMAL_PDF);
    await db.document.create({
      data: {
        userId,
        type,
        fileName: `${type.toLowerCase()}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: MINIMAL_PDF.length,
        storageKey,
      },
    });
  }
}

/** Cria um contrato completo com cronograma, lançamentos e parcelas pagas. */
async function seedContract(params: {
  userId: string;
  principalCents: number;
  termMonths: number;
  monthlyRateBps: number;
  startedMonthsAgo: number;
  paidInstallments: number;
  settle: boolean;
}) {
  const startDate = monthsAgo(params.startedMonthsAgo);
  const quote = quoteCredit({
    requestedCents: params.principalCents,
    termMonths: params.termMonths,
    monthlyRateBps: params.monthlyRateBps,
    startDate,
  });

  const application = await db.creditApplication.create({
    data: {
      userId: params.userId,
      amountCents: params.principalCents,
      termMonths: params.termMonths,
      purpose: "Capital de giro",
      status: "CONTRACTED",
      decisionReason: "Todos os critérios da política de crédito foram atendidos.",
      scoreAtDecision: 520,
      monthlyRateBps: params.monthlyRateBps,
      iofCents: quote.iofCents,
      cetYearlyBps: quote.cetYearlyBps,
      totalPayableCents: quote.totalPayableCents,
      installmentCents: quote.installmentCents,
      decidedAt: startDate,
      createdAt: startDate,
    },
  });

  const contract = await db.contract.create({
    data: {
      number: `VLR-${startDate.getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`,
      applicationId: application.id,
      userId: params.userId,
      principalCents: params.principalCents,
      iofCents: quote.iofCents,
      monthlyRateBps: params.monthlyRateBps,
      cetYearlyBps: quote.cetYearlyBps,
      termMonths: params.termMonths,
      totalPayableCents: quote.totalPayableCents,
      status: params.settle ? "SETTLED" : "ACTIVE",
      signedAt: startDate,
      signatureHash: "seed",
      disbursedAt: startDate,
      settledAt: params.settle ? quote.installments[params.termMonths - 1].dueDate : null,
      createdAt: startDate,
    },
  });

  const [userWallet, funding, receivable, revenue, cashbackPool] = await Promise.all([
    wallet(params.userId),
    platformAccount("FUNDING"),
    platformAccount("RECEIVABLE"),
    platformAccount("REVENUE"),
    platformAccount("CASHBACK_POOL"),
  ]);

  await post({
    kind: "DISBURSEMENT",
    description: `Liberação do contrato ${contract.number}`,
    reference: contract.number,
    createdAt: startDate,
    entries: [
      { accountId: receivable.id, direction: "DEBIT", amountCents: quote.financedCents },
      { accountId: userWallet.id, direction: "CREDIT", amountCents: params.principalCents },
      { accountId: revenue.id, direction: "CREDIT", amountCents: quote.iofCents },
    ],
  });

  for (const installment of quote.installments) {
    const paid = installment.number <= params.paidInstallments;
    const record = await db.installment.create({
      data: {
        contractId: contract.id,
        number: installment.number,
        dueDate: installment.dueDate,
        principalCents: installment.principalCents,
        interestCents: installment.interestCents,
        totalCents: installment.totalCents,
        paidCents: paid ? installment.totalCents : 0,
        status: paid ? "PAID" : installment.dueDate < new Date() ? "LATE" : "OPEN",
        // Pagamentos do histórico caem dois dias antes do vencimento.
        paidAt: paid ? new Date(installment.dueDate.getTime() - 2 * 86_400_000) : null,
      },
    });

    if (!paid) continue;

    const paidAt = new Date(installment.dueDate.getTime() - 2 * 86_400_000);
    const transaction = await post({
      kind: "INSTALLMENT_PAYMENT",
      description: `Parcela ${installment.number}/${params.termMonths} do contrato ${contract.number}`,
      reference: contract.number,
      createdAt: paidAt,
      entries: [
        { accountId: funding.id, direction: "DEBIT", amountCents: installment.totalCents },
        { accountId: receivable.id, direction: "CREDIT", amountCents: installment.principalCents },
        { accountId: revenue.id, direction: "CREDIT", amountCents: installment.interestCents },
      ],
    });

    await db.payment.create({
      data: {
        contractId: contract.id,
        installmentId: record.id,
        amountCents: installment.totalCents,
        method: "PIX",
        railReference: `SBX-SEED-${installment.number}`,
        railProvider: "SANDBOX",
        transactionId: transaction.id,
        paidAt,
      },
    });
  }

  if (params.settle) {
    const totalInterest = quote.installments.reduce((sum, item) => sum + item.interestCents, 0);
    const cashback = Math.round((totalInterest * LEVEL_POLICY.Ouro.cashbackOnInterestBps) / 10000);
    const settledAt = quote.installments[params.termMonths - 1].dueDate;

    await post({
      kind: "CASHBACK",
      description: `Cashback pela quitação integral do contrato ${contract.number}`,
      reference: contract.number,
      createdAt: settledAt,
      entries: [
        { accountId: cashbackPool.id, direction: "DEBIT", amountCents: cashback },
        { accountId: userWallet.id, direction: "CREDIT", amountCents: cashback },
      ],
    });

    await db.cashbackGrant.create({
      data: {
        userId: params.userId,
        contractId: contract.id,
        amountCents: cashback,
        grantedAt: settledAt,
      },
    });
  }

  return contract;
}


/**
 * Contrato aprovado e aguardando assinatura.
 *
 * Diferente de `seedContract`: não gera cronograma nem lançamentos, porque
 * nada disso existe antes do aceite. É o estado que permite exercitar a
 * assinatura e ver o dinheiro cair na conta.
 */
async function seedPendingContract(params: {
  userId: string;
  principalCents: number;
  termMonths: number;
  monthlyRateBps: number;
}) {
  const cotacao = quoteCredit({
    requestedCents: params.principalCents,
    termMonths: params.termMonths,
    monthlyRateBps: params.monthlyRateBps,
  });

  const application = await db.creditApplication.create({
    data: {
      userId: params.userId,
      amountCents: params.principalCents,
      termMonths: params.termMonths,
      purpose: "Reforma da loja",
      status: "APPROVED",
      decisionReason: "Todos os critérios da política de crédito foram atendidos.",
      scoreAtDecision: 640,
      monthlyRateBps: params.monthlyRateBps,
      iofCents: cotacao.iofCents,
      cetYearlyBps: cotacao.cetYearlyBps,
      totalPayableCents: cotacao.totalPayableCents,
      installmentCents: cotacao.installmentCents,
      decidedAt: new Date(),
    },
  });

  return db.contract.create({
    data: {
      number: `VLR-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`,
      applicationId: application.id,
      userId: params.userId,
      principalCents: params.principalCents,
      iofCents: cotacao.iofCents,
      monthlyRateBps: params.monthlyRateBps,
      cetYearlyBps: cotacao.cetYearlyBps,
      termMonths: params.termMonths,
      totalPayableCents: cotacao.totalPayableCents,
      status: "AWAITING_SIGNATURE",
    },
  });
}

/** Crédito avulso na carteira, para que a conta tenha saldo para pagar. */
async function seedDeposit(userId: string, amountCents: number) {
  const [carteira, caixa] = await Promise.all([wallet(userId), platformAccount("FUNDING")]);
  await post({
    kind: "DEPOSIT",
    description: "Depósito via SANDBOX",
    createdAt: monthsAgo(1),
    entries: [
      { accountId: caixa.id, direction: "DEBIT", amountCents },
      { accountId: carteira.id, direction: "CREDIT", amountCents },
    ],
  });
}

async function main() {
  console.log("Limpando base…");
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.scoreSnapshot.deleteMany(),
    db.cashbackGrant.deleteMany(),
    db.payment.deleteMany(),
    db.installment.deleteMany(),
    db.contract.deleteMany(),
    db.creditApplication.deleteMany(),
    db.transfer.deleteMany(),
    db.ledgerEntry.deleteMany(),
    db.ledgerTransaction.deleteMany(),
    db.account.deleteMany(),
    db.personalReference.deleteMany(),
    db.document.deleteMany(),
    db.kycProfile.deleteMany(),
    db.session.deleteMany(),
    db.user.deleteMany(),
  ]);

  for (const account of PLATFORM_ACCOUNTS) await platformAccount(account.kind);

  const password = await hashPassword("Valor@2026");

  const analyst = await db.user.create({
    data: {
      name: "Helena Nogueira",
      email: "analista@valor.com.br",
      cpf: "39053344705",
      phone: "11988887777",
      passwordHash: password,
      role: "ANALYST",
      status: "ACTIVE",
    },
  });
  await wallet(analyst.id);

  // Cliente com histórico: um contrato quitado e outro em andamento.
  const veteran = await db.user.create({
    data: {
      name: "Marina Souza",
      email: "cliente@exemplo.com",
      cpf: "52998224725",
      phone: "11977776666",
      passwordHash: password,
      status: "ACTIVE",
      createdAt: monthsAgo(20),
    },
  });
  await wallet(veteran.id);
  await db.kycProfile.create({
    data: {
      userId: veteran.id,
      birthDate: new Date("1991-04-18"),
      motherName: "Cleide Souza",
      occupation: "Microempreendedora",
      monthlyIncomeCents: 480_000,
      zipCode: "01310200",
      street: "Avenida Paulista",
      number: "1000",
      district: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      status: "APPROVED",
      submittedAt: monthsAgo(20),
      reviewedAt: monthsAgo(20),
      reviewedById: analyst.id,
    },
  });
  await createDocuments(veteran.id);
  await db.document.updateMany({ where: { userId: veteran.id }, data: { status: "APPROVED" } });
  await db.personalReference.createMany({
    data: [
      { userId: veteran.id, name: "Ricardo Souza", phone: "11966665555", relationship: "Irmão" },
      { userId: veteran.id, name: "Paula Lima", phone: "11955554444", relationship: "Sócia" },
    ],
  });

  await seedContract({
    userId: veteran.id,
    principalCents: 220_000,
    termMonths: 12,
    monthlyRateBps: LEVEL_POLICY.Prata.monthlyRateBps,
    startedMonthsAgo: 18,
    paidInstallments: 12,
    settle: true,
  });

  await seedContract({
    userId: veteran.id,
    principalCents: 435_000,
    termMonths: 18,
    monthlyRateBps: LEVEL_POLICY.Ouro.monthlyRateBps,
    startedMonthsAgo: 5,
    paidInstallments: 5,
    settle: false,
  });

  // Cliente com cadastro aguardando análise — alimenta a fila do backoffice.
  const pending = await db.user.create({
    data: {
      name: "João Vitor Almeida",
      email: "pendente@exemplo.com",
      cpf: "15350946056",
      phone: "21988884444",
      passwordHash: password,
      status: "PENDING_KYC",
      createdAt: monthsAgo(1),
    },
  });
  await wallet(pending.id);
  await db.kycProfile.create({
    data: {
      userId: pending.id,
      birthDate: new Date("1996-11-02"),
      motherName: "Sandra Almeida",
      occupation: "Motorista de aplicativo",
      monthlyIncomeCents: 320_000,
      zipCode: "20040002",
      street: "Rua da Assembleia",
      number: "10",
      district: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      status: "SUBMITTED",
      submittedAt: monthsAgo(0),
    },
  });
  await createDocuments(pending.id);
  await db.personalReference.createMany({
    data: [
      { userId: pending.id, name: "Carla Almeida", phone: "21977773333", relationship: "Mãe" },
      { userId: pending.id, name: "Diego Ramos", phone: "21966662222", relationship: "Amigo" },
    ],
  });

  // Recalcula os scores com o histórico já gravado.
  const { recalculateScore } = await import("../src/server/services/scoring");
  const recalcular = (userId: string) => recalculateScore(userId, "Carga inicial");
  for (const user of [veteran, pending, analyst]) {
    await recalcular(user.id);
  }

  /**
   * Conta de exploração.
   *
   * Senha curta de propósito, para facilitar o acesso durante a avaliação do
   * piloto — ela fica abaixo da política do próprio produto (dez caracteres,
   * com maiúscula, minúscula e número), então não seria aceita pela tela de
   * cadastro. Por isso a conta só nasce fora de produção: em produção, uma
   * credencial fraca conhecida é porta aberta.
   */
  if (process.env.NODE_ENV === "production") {
    console.log("\nNODE_ENV=production: conta de teste com senha fraca não foi criada.");
  } else {
    const teste = await db.user.create({
      data: {
        name: "Rafael Teste",
        email: "teste@exemplo.com",
        cpf: "16899535009",
        phone: "11955551111",
        passwordHash: await hashPassword("123"),
        status: "ACTIVE",
        createdAt: monthsAgo(14),
      },
    });
    await wallet(teste.id);
    await db.kycProfile.create({
      data: {
        userId: teste.id,
        birthDate: new Date("1988-09-12"),
        motherName: "Regina Teste",
        occupation: "Comerciante",
        monthlyIncomeCents: 650_000,
        zipCode: "30140071",
        street: "Avenida Afonso Pena",
        number: "500",
        district: "Centro",
        city: "Belo Horizonte",
        state: "MG",
        status: "APPROVED",
        submittedAt: monthsAgo(14),
        reviewedAt: monthsAgo(14),
        reviewedById: analyst.id,
      },
    });
    await createDocuments(teste.id);
    await db.document.updateMany({ where: { userId: teste.id }, data: { status: "APPROVED" } });
    await db.personalReference.createMany({
      data: [
        { userId: teste.id, name: "Beatriz Teste", phone: "11944442222", relationship: "Irmã" },
        { userId: teste.id, name: "Otávio Prado", phone: "11933331111", relationship: "Sócio" },
      ],
    });

    // Histórico encerrado, para o cashback já aparecer na conta.
    await seedContract({
      userId: teste.id,
      principalCents: 180_000,
      termMonths: 12,
      monthlyRateBps: LEVEL_POLICY.Prata.monthlyRateBps,
      startedMonthsAgo: 13,
      paidInstallments: 12,
      settle: true,
    });

    // Contrato na última parcela: pagar aqui dispara quitação, cashback e
    // recálculo de score na hora — o ciclo inteiro em um clique.
    await seedContract({
      userId: teste.id,
      principalCents: 240_000,
      termMonths: 12,
      monthlyRateBps: LEVEL_POLICY.Ouro.monthlyRateBps,
      startedMonthsAgo: 11,
      paidInstallments: 11,
      settle: false,
    });

    // Proposta aprovada esperando aceite: exercita assinatura e liberação.
    await seedPendingContract({
      userId: teste.id,
      principalCents: 200_000,
      termMonths: 12,
      monthlyRateBps: LEVEL_POLICY.Ouro.monthlyRateBps,
    });

    await seedDeposit(teste.id, 300_000);
    await recalcular(teste.id);
  }


  console.log("\nAmbiente pronto.\n");
  console.log("  teste@exemplo.com      senha 123          conta de exploração");
  console.log("  cliente@exemplo.com    senha Valor@2026   histórico e contrato ativo");
  console.log("  pendente@exemplo.com   senha Valor@2026   cadastro aguardando verificação");
  console.log("  analista@valor.com.br  senha Valor@2026   backoffice (fila de análise)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
