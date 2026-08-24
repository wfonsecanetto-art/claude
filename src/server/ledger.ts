import type { Prisma } from "@prisma/client";
import { db } from "./db";
import type { Cents } from "./money";

/**
 * Razão contábil de dupla entrada.
 *
 * Nenhum saldo é guardado em coluna: saldo é sempre a soma das partidas. Isso
 * torna impossível um saldo divergir do histórico, e qualquer valor exibido ao
 * cliente pode ser reconstruído a partir dos lançamentos.
 */

export const ACCOUNT_KINDS = {
  /** Saldo do cliente na plataforma (passivo da instituição). */
  WALLET: "WALLET",
  /** Caixa que financia as liberações. */
  FUNDING: "FUNDING",
  /** Direitos a receber dos contratos ativos. */
  RECEIVABLE: "RECEIVABLE",
  /** Juros, tarifas e IOF apurados. */
  REVENUE: "REVENUE",
  /** Provisão de cashback. */
  CASHBACK_POOL: "CASHBACK_POOL",
} as const;

export type AccountKind = (typeof ACCOUNT_KINDS)[keyof typeof ACCOUNT_KINDS];

export type EntryInput = {
  accountId: string;
  direction: "DEBIT" | "CREDIT";
  amountCents: Cents;
};

type Client = Prisma.TransactionClient | typeof db;

/** Contas internas da instituição, criadas sob demanda. */
export async function getPlatformAccount(kind: AccountKind, client: Client = db) {
  const existing = await client.account.findFirst({ where: { kind, userId: null } });
  if (existing) return existing;

  const labels: Record<AccountKind, string> = {
    WALLET: "Carteira",
    FUNDING: "Caixa de funding",
    RECEIVABLE: "Carteira de recebíveis",
    REVENUE: "Receitas e tributos",
    CASHBACK_POOL: "Provisão de cashback",
  };

  return client.account.create({ data: { kind, label: labels[kind] } });
}

export async function getWalletAccount(userId: string, client: Client = db) {
  const existing = await client.account.findFirst({
    where: { kind: ACCOUNT_KINDS.WALLET, userId },
  });
  if (existing) return existing;

  return client.account.create({
    data: { kind: ACCOUNT_KINDS.WALLET, userId, label: "Conta Valor" },
  });
}

/**
 * Registra uma transação balanceada.
 *
 * Recusa qualquer lançamento cuja soma de débitos não iguale a de créditos —
 * o erro aparece na escrita, não numa conciliação semanas depois.
 */
export async function post(
  client: Client,
  params: {
    kind: string;
    description: string;
    reference?: string;
    entries: EntryInput[];
  },
) {
  const debits = params.entries
    .filter((entry) => entry.direction === "DEBIT")
    .reduce((sum, entry) => sum + entry.amountCents, 0);
  const credits = params.entries
    .filter((entry) => entry.direction === "CREDIT")
    .reduce((sum, entry) => sum + entry.amountCents, 0);

  if (debits !== credits) {
    throw new Error(
      `Lançamento desbalanceado: débitos ${debits} ≠ créditos ${credits} (${params.description})`,
    );
  }
  if (params.entries.some((entry) => entry.amountCents <= 0)) {
    throw new Error("Partidas precisam ter valor positivo");
  }

  return client.ledgerTransaction.create({
    data: {
      kind: params.kind,
      description: params.description,
      reference: params.reference,
      entries: { create: params.entries },
    },
    include: { entries: true },
  });
}

/** Saldo da conta. Carteira é conta credora: créditos aumentam o saldo. */
export async function balanceOf(accountId: string, client: Client = db): Promise<Cents> {
  const grouped = await client.ledgerEntry.groupBy({
    by: ["direction"],
    where: { accountId },
    _sum: { amountCents: true },
  });

  const total = (direction: "DEBIT" | "CREDIT") =>
    grouped.find((row) => row.direction === direction)?._sum.amountCents ?? 0;

  return total("CREDIT") - total("DEBIT");
}

export async function walletBalance(userId: string, client: Client = db): Promise<Cents> {
  const account = await getWalletAccount(userId, client);
  return balanceOf(account.id, client);
}

export type StatementLine = {
  id: string;
  date: Date;
  kind: string;
  description: string;
  amountCents: Cents;
  direction: "IN" | "OUT";
  balanceCents: Cents;
};

/** Extrato da carteira, com saldo corrente acumulado. */
export async function walletStatement(userId: string, limit = 50): Promise<StatementLine[]> {
  const account = await getWalletAccount(userId);
  const entries = await db.ledgerEntry.findMany({
    where: { accountId: account.id },
    include: { transaction: true },
    orderBy: { createdAt: "asc" },
  });

  let running = 0;
  const lines = entries.map((entry) => {
    const signed = entry.direction === "CREDIT" ? entry.amountCents : -entry.amountCents;
    running += signed;
    return {
      id: entry.id,
      date: entry.createdAt,
      kind: entry.transaction.kind,
      description: entry.transaction.description,
      amountCents: entry.amountCents,
      direction: entry.direction === "CREDIT" ? ("IN" as const) : ("OUT" as const),
      balanceCents: running,
    };
  });

  return lines.reverse().slice(0, limit);
}
