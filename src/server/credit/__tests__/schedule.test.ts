import { describe, expect, it } from "vitest";
import { addMonthsKeepingDay, monthlyIrr, priceInstallment, quoteCredit } from "../schedule";

describe("Tabela Price", () => {
  it("calcula a parcela pela fórmula do sistema francês", () => {
    // 10.000,00 em 12x a 2% a.m. → 945,60 (valor de referência de mercado)
    expect(priceInstallment(1_000_000, 0.02, 12)).toBe(94560);
  });

  it("divide em partes iguais quando a taxa é zero", () => {
    expect(priceInstallment(120_000, 0, 12)).toBe(10_000);
  });
});

describe("Vencimentos", () => {
  it("preserva o dia do mês", () => {
    const due = addMonthsKeepingDay(new Date(Date.UTC(2026, 0, 15)), 3);
    expect(due.toISOString().slice(0, 10)).toBe("2026-04-15");
  });

  it("ajusta para o último dia em meses curtos", () => {
    const due = addMonthsKeepingDay(new Date(Date.UTC(2026, 0, 31)), 1);
    expect(due.toISOString().slice(0, 10)).toBe("2026-02-28");
  });
});

describe("Proposta completa", () => {
  const quote = quoteCredit({
    requestedCents: 500_000,
    termMonths: 12,
    monthlyRateBps: 490,
    startDate: new Date(Date.UTC(2026, 0, 10)),
  });

  it("gera uma parcela por mês do prazo", () => {
    expect(quote.installments).toHaveLength(12);
  });

  it("fecha a soma das parcelas com o total a pagar", () => {
    const sum = quote.installments.reduce((total, item) => total + item.totalCents, 0);
    expect(sum).toBe(quote.totalPayableCents);
  });

  it("amortiza exatamente o valor financiado, sem sobra de centavos", () => {
    const principal = quote.installments.reduce((total, item) => total + item.principalCents, 0);
    expect(principal).toBe(quote.financedCents);
  });

  it("zera o saldo devedor na última parcela", () => {
    expect(quote.installments.at(-1)?.balanceCents).toBe(0);
  });

  it("financia o IOF junto com o principal", () => {
    expect(quote.financedCents).toBe(quote.requestedCents + quote.iofCents);
    // IOF de crédito PF fica entre 0,38% (fixo) e ~3,4% do valor em 12 meses.
    expect(quote.iofCents / quote.requestedCents).toBeGreaterThan(0.0038);
    expect(quote.iofCents / quote.requestedCents).toBeLessThan(0.035);
  });

  it("apura CET acima da taxa nominal, porque o IOF entra no custo", () => {
    const nominalYearly = Math.pow(1 + 0.049, 12) - 1;
    expect(quote.cetYearlyBps / 10000).toBeGreaterThan(nominalYearly);
  });
});

describe("Taxa interna de retorno", () => {
  it("recupera a taxa de um fluxo conhecido", () => {
    // 1.000,00 pagos em 12x de 94,56 correspondem a 2% a.m.
    const rate = monthlyIrr(100_000, Array.from({ length: 12 }, () => 9456));
    expect(rate).toBeCloseTo(0.02, 4);
  });
});
