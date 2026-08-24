import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { db } from "../db";
import { writeAudit } from "../audit";
import { recalculateScore } from "./scoring";

/**
 * Cadastro, documentos e verificação.
 *
 * Documentos nunca vão para /public: ficam em um diretório privado fora da
 * árvore servida estaticamente, e só são entregues por rota autenticada.
 */

const STORAGE_ROOT = path.join(process.cwd(), "storage", "documents");

export const DOCUMENT_TYPES = {
  IDENTITY: "Documento de identidade",
  SELFIE: "Selfie com documento",
  PROOF_OF_ADDRESS: "Comprovante de residência",
  PROOF_OF_INCOME: "Comprovante de renda",
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 8 * 1024 * 1024;

export async function storeDocument(params: {
  userId: string;
  type: DocumentType;
  file: File;
}) {
  if (!ACCEPTED_MIME.includes(params.file.type)) {
    throw new Error("Envie um arquivo JPG, PNG, WEBP ou PDF.");
  }
  if (params.file.size > MAX_BYTES) {
    throw new Error("O arquivo precisa ter no máximo 8 MB.");
  }
  if (params.file.size === 0) {
    throw new Error("Arquivo vazio.");
  }

  const extension = params.file.type === "application/pdf" ? "pdf" : params.file.type.split("/")[1];
  const storageKey = `${params.userId}/${randomUUID()}.${extension}`;
  const target = path.join(STORAGE_ROOT, storageKey);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await params.file.arrayBuffer()));

  // Um documento por tipo: reenviar substitui o anterior.
  await db.document.deleteMany({ where: { userId: params.userId, type: params.type } });

  const document = await db.document.create({
    data: {
      userId: params.userId,
      type: params.type,
      fileName: params.file.name.slice(0, 120),
      mimeType: params.file.type,
      sizeBytes: params.file.size,
      storageKey,
    },
  });

  await writeAudit({
    actorId: params.userId,
    action: "kyc.document.uploaded",
    entity: "Document",
    entityId: document.id,
    metadata: { type: params.type, sizeBytes: params.file.size },
  });

  return document;
}

export function documentPath(storageKey: string): string {
  const resolved = path.resolve(STORAGE_ROOT, storageKey);
  // Impede que uma chave manipulada escape do diretório de armazenamento.
  if (!resolved.startsWith(path.resolve(STORAGE_ROOT))) {
    throw new Error("Chave de documento inválida");
  }
  return resolved;
}

export type OnboardingState = {
  hasProfile: boolean;
  documents: Record<DocumentType, boolean>;
  referencesCount: number;
  kycStatus: string;
  canSubmit: boolean;
  missing: string[];
};

export async function onboardingState(userId: string): Promise<OnboardingState> {
  const [kyc, documents, referencesCount] = await Promise.all([
    db.kycProfile.findUnique({ where: { userId } }),
    db.document.findMany({ where: { userId } }),
    db.personalReference.count({ where: { userId } }),
  ]);

  const byType = Object.fromEntries(
    (Object.keys(DOCUMENT_TYPES) as DocumentType[]).map((type) => [
      type,
      documents.some((document) => document.type === type),
    ]),
  ) as Record<DocumentType, boolean>;

  const missing: string[] = [];
  if (!kyc) missing.push("Dados pessoais e endereço");
  if (!byType.IDENTITY) missing.push(DOCUMENT_TYPES.IDENTITY);
  if (!byType.SELFIE) missing.push(DOCUMENT_TYPES.SELFIE);
  if (!byType.PROOF_OF_ADDRESS) missing.push(DOCUMENT_TYPES.PROOF_OF_ADDRESS);
  if (referencesCount < 2) missing.push("Duas referências pessoais");

  return {
    hasProfile: Boolean(kyc),
    documents: byType,
    referencesCount,
    kycStatus: kyc?.status ?? "DRAFT",
    canSubmit: missing.length === 0 && (kyc?.status === "DRAFT" || kyc?.status === "REJECTED"),
    missing,
  };
}

export async function submitForReview(userId: string, ip?: string | null) {
  const state = await onboardingState(userId);
  if (!state.canSubmit) throw new Error("Complete todas as etapas antes de enviar.");

  await db.kycProfile.update({
    where: { userId },
    data: { status: "SUBMITTED", submittedAt: new Date(), rejectionReason: null },
  });

  await writeAudit({
    actorId: userId,
    action: "kyc.submitted",
    entity: "KycProfile",
    entityId: userId,
    ip,
  });
}

/** Decisão do backoffice sobre a verificação. */
export async function reviewKyc(params: {
  userId: string;
  analystId: string;
  approve: boolean;
  reason?: string;
  ip?: string | null;
}) {
  await db.$transaction(async (tx) => {
    await tx.kycProfile.update({
      where: { userId: params.userId },
      data: {
        status: params.approve ? "APPROVED" : "REJECTED",
        rejectionReason: params.approve ? null : (params.reason ?? "Documentação inconsistente."),
        reviewedAt: new Date(),
        reviewedById: params.analystId,
      },
    });

    await tx.document.updateMany({
      where: { userId: params.userId },
      data: { status: params.approve ? "APPROVED" : "REJECTED" },
    });

    await tx.user.update({
      where: { id: params.userId },
      data: { status: params.approve ? "ACTIVE" : "PENDING_KYC" },
    });
  });

  await recalculateScore(params.userId, params.approve ? "Cadastro aprovado" : "Cadastro recusado");

  await writeAudit({
    actorId: params.analystId,
    action: params.approve ? "kyc.approved" : "kyc.rejected",
    entity: "KycProfile",
    entityId: params.userId,
    metadata: { reason: params.reason },
    ip: params.ip,
  });
}
