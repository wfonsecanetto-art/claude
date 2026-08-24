import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma como singleton.
 *
 * Em desenvolvimento o hot reload recria os módulos a cada alteração; sem o
 * cache global, cada recarga abriria um novo pool de conexões.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
