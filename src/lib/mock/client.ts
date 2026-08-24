import { demoContracts, demoOffers, demoPosition, demoScore } from "./data";
import type { ValorPlatformClient } from "./types";

/**
 * Implementação de demonstração do cliente da plataforma.
 *
 * Resolve em memória, com um atraso simbólico apenas para que estados de
 * carregamento possam ser exercitados na UI. Substituir por uma implementação
 * HTTP quando o back-end existir — a interface permanece a mesma.
 */
export function createMockValorClient(latencyMs = 240): ValorPlatformClient {
  const settle = <T,>(value: T): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(value), latencyMs));

  return {
    source: "demo",
    getScore: () => settle(demoScore),
    getCreditPosition: () => settle(demoPosition),
    listContracts: () => settle(demoContracts),
    listOffers: () => settle(demoOffers),
  };
}

/** Cliente ativo do piloto. Sempre "demo" enquanto não houver back-end. */
export const valorClient: ValorPlatformClient = createMockValorClient();
