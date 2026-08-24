import { db } from "./db";

/**
 * Trilha de auditoria.
 *
 * Toda decisão de crédito, alteração de cadastro e evento de segurança precisa
 * ficar registrada com autor, alvo e horário — é o que permite explicar uma
 * decisão meses depois e o que um regulador vai pedir primeiro.
 */
export async function writeAudit(params: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  await db.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ip: params.ip ?? null,
    },
  });
}
