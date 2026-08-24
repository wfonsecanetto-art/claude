/**
 * Dinheiro em centavos, sempre inteiro.
 *
 * Ponto flutuante não representa 0,1 exatamente; somar parcelas em `number`
 * decimal acumula erro que aparece como divergência de um centavo no fim do
 * contrato. Todo valor monetário do sistema é `Int` de centavos.
 */

export type Cents = number;

export function reaisToCents(value: number): Cents {
  return Math.round(value * 100);
}

export function centsToReais(cents: Cents): number {
  return cents / 100;
}

export function formatBRL(cents: Cents): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatBRLCompact(cents: Cents): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Basis points → fração. 590 bps = 5,90%. */
export function bpsToRate(bps: number): number {
  return bps / 10000;
}

export function rateToBps(rate: number): number {
  return Math.round(rate * 10000);
}

export function formatBps(bps: number, fractionDigits = 2): string {
  return `${(bps / 100).toFixed(fractionDigits).replace(".", ",")}%`;
}

export function formatPercent(rate: number, fractionDigits = 2): string {
  return `${(rate * 100).toFixed(fractionDigits).replace(".", ",")}%`;
}
