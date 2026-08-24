import { randomUUID } from "node:crypto";
import type { Cents } from "../money";

/**
 * Trilho de pagamento.
 *
 * A plataforma não é instituição de pagamento e não tem acesso ao SPI. Toda
 * movimentação externa passa por esta interface; hoje existe apenas a
 * implementação SANDBOX, que registra a intenção e devolve uma referência
 * sintética. Quando houver parceiro (BaaS ou autorização própria), basta uma
 * implementação nova — nada acima desta camada muda.
 */

export type ChargeRequest = {
  amountCents: Cents;
  description: string;
  payerDocument: string;
  method: "PIX" | "BOLETO";
};

export type ChargeResult = {
  provider: string;
  reference: string;
  status: "SETTLED" | "PENDING";
  /** Copia-e-cola do Pix ou linha digitável — sintético no sandbox. */
  payload: string;
};

export type PayoutRequest = {
  amountCents: Cents;
  description: string;
  beneficiaryDocument: string;
};

export type PayoutResult = {
  provider: string;
  reference: string;
  status: "SETTLED" | "PENDING";
};

export interface PaymentRail {
  readonly provider: string;
  readonly isSandbox: boolean;
  createCharge(request: ChargeRequest): Promise<ChargeResult>;
  createPayout(request: PayoutRequest): Promise<PayoutResult>;
}

/**
 * Implementação de sandbox: liquida na hora, sem sair do sistema.
 * Nenhum centavo se move para fora da plataforma.
 */
export const sandboxRail: PaymentRail = {
  provider: "SANDBOX",
  isSandbox: true,

  async createCharge(request) {
    const reference = `SBX-${randomUUID().slice(0, 13).toUpperCase()}`;
    return {
      provider: "SANDBOX",
      reference,
      status: "SETTLED",
      payload:
        request.method === "PIX"
          ? `00020126SANDBOX${reference}5204000053039865802BR`
          : `00000.00000 00000.000000 00000.000000 0 ${reference}`,
    };
  },

  async createPayout(request) {
    return {
      provider: "SANDBOX",
      reference: `SBX-OUT-${randomUUID().slice(0, 10).toUpperCase()}`,
      status: request.amountCents > 0 ? "SETTLED" : "PENDING",
    };
  },
};

/** Trilho ativo. Trocar aqui quando existir parceiro contratado. */
export const paymentRail: PaymentRail = sandboxRail;
