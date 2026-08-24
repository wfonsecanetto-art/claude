import { IOF } from "./rates";
import { bpsToRate, rateToBps, type Cents } from "../money";

/**
 * Matemática do contrato: Tabela Price, IOF e CET.
 *
 * Tudo em centavos inteiros. A última parcela absorve a diferença de
 * arredondamento para que a soma das parcelas feche exatamente com o total.
 */

export type InstallmentPlan = {
  number: number;
  dueDate: Date;
  principalCents: Cents;
  interestCents: Cents;
  totalCents: Cents;
  /** Saldo devedor após esta parcela. */
  balanceCents: Cents;
  /** Dias entre a liberação e o vencimento — base do IOF diário. */
  daysFromStart: number;
};

export type CreditQuote = {
  /** Valor que o cliente recebe. */
  requestedCents: Cents;
  /** Valor financiado = solicitado + IOF. */
  financedCents: Cents;
  iofCents: Cents;
  termMonths: number;
  monthlyRateBps: number;
  installmentCents: Cents;
  totalPayableCents: Cents;
  totalInterestCents: Cents;
  /** Custo Efetivo Total anual, em basis points. */
  cetYearlyBps: number;
  firstDueDate: Date;
  installments: InstallmentPlan[];
};

/** Parcela da Tabela Price: PMT = PV · i / (1 − (1+i)^−n). */
export function priceInstallment(presentValueCents: Cents, monthlyRate: number, term: number): Cents {
  if (term <= 0) throw new Error("Prazo precisa ser positivo");
  if (monthlyRate === 0) return Math.round(presentValueCents / term);
  const factor = monthlyRate / (1 - Math.pow(1 + monthlyRate, -term));
  return Math.round(presentValueCents * factor);
}

/** Vencimento mensal preservando o dia; meses curtos caem no último dia. */
export function addMonthsKeepingDay(start: Date, months: number): Date {
  const day = start.getUTCDate();
  const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function buildSchedule(
  financedCents: Cents,
  monthlyRate: number,
  term: number,
  startDate: Date,
): InstallmentPlan[] {
  const installment = priceInstallment(financedCents, monthlyRate, term);
  const plan: InstallmentPlan[] = [];
  let balance = financedCents;

  for (let number = 1; number <= term; number += 1) {
    const interest = Math.round(balance * monthlyRate);
    const isLast = number === term;
    // A última parcela liquida o saldo remanescente: evita sobra de centavos.
    const principal = isLast ? balance : installment - interest;
    const total = isLast ? principal + interest : installment;
    balance -= principal;

    const dueDate = addMonthsKeepingDay(startDate, number);
    plan.push({
      number,
      dueDate,
      principalCents: principal,
      interestCents: interest,
      totalCents: total,
      balanceCents: Math.max(balance, 0),
      daysFromStart: daysBetween(startDate, dueDate),
    });
  }

  return plan;
}

/**
 * IOF de crédito a pessoa física: alíquota adicional sobre a operação mais a
 * alíquota diária aplicada a cada parcela de principal, limitada a 365 dias.
 */
function calculateIof(requestedCents: Cents, schedule: InstallmentPlan[]): Cents {
  const fixed = requestedCents * IOF.fixedRate;
  const daily = schedule.reduce((sum, installment) => {
    const days = Math.min(installment.daysFromStart, IOF.maxDays);
    return sum + installment.principalCents * IOF.dailyRate * days;
  }, 0);
  return Math.round(fixed + daily);
}

/**
 * Taxa interna de retorno mensal do fluxo do cliente, por bisseção.
 *
 * O cliente recebe `requestedCents` em t0 e paga as parcelas; a taxa que zera
 * o valor presente é o custo efetivo. Bisseção em vez de Newton porque não
 * depende de chute inicial e não diverge.
 */
export function monthlyIrr(receivedCents: Cents, payments: Cents[]): number {
  const npv = (rate: number) =>
    payments.reduce(
      (sum, payment, index) => sum + payment / Math.pow(1 + rate, index + 1),
      -receivedCents,
    );

  let low = 0;
  let high = 1; // 100% ao mês é teto de busca, muito acima de qualquer oferta
  if (npv(low) < 0) return 0; // pagamentos não cobrem o principal

  for (let iteration = 0; iteration < 200; iteration += 1) {
    const mid = (low + high) / 2;
    if (npv(mid) > 0) low = mid;
    else high = mid;
  }

  return (low + high) / 2;
}

/**
 * Monta a proposta completa.
 *
 * O IOF é financiado junto com o principal, o que cria uma dependência
 * circular (o IOF depende do cronograma, que depende do valor financiado).
 * Três iterações convergem com folga na casa do centavo.
 */
export function quoteCredit(params: {
  requestedCents: Cents;
  termMonths: number;
  monthlyRateBps: number;
  startDate?: Date;
}): CreditQuote {
  const { requestedCents, termMonths, monthlyRateBps } = params;
  const startDate = params.startDate ?? new Date();
  const monthlyRate = bpsToRate(monthlyRateBps);

  let financed = requestedCents;
  let iof = 0;
  let schedule = buildSchedule(financed, monthlyRate, termMonths, startDate);

  for (let iteration = 0; iteration < 3; iteration += 1) {
    iof = calculateIof(requestedCents, schedule);
    financed = requestedCents + iof;
    schedule = buildSchedule(financed, monthlyRate, termMonths, startDate);
  }

  const totalPayable = schedule.reduce((sum, item) => sum + item.totalCents, 0);
  const totalInterest = schedule.reduce((sum, item) => sum + item.interestCents, 0);
  const irr = monthlyIrr(
    requestedCents,
    schedule.map((item) => item.totalCents),
  );
  const cetYearly = Math.pow(1 + irr, 12) - 1;

  return {
    requestedCents,
    financedCents: financed,
    iofCents: iof,
    termMonths,
    monthlyRateBps,
    installmentCents: schedule[0]?.totalCents ?? 0,
    totalPayableCents: totalPayable,
    totalInterestCents: totalInterest,
    cetYearlyBps: rateToBps(cetYearly),
    firstDueDate: schedule[0]?.dueDate ?? startDate,
    installments: schedule,
  };
}
