"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { clientIp } from "@/server/auth/session";
import { requireUser } from "@/server/auth/guards";
import {
  storeDocument,
  submitForReview,
  type DocumentType,
} from "@/server/services/onboarding";
import { kycSchema, parseBrlToCents, referenceSchema } from "@/server/validation";
import type { ActionState } from "./auth";

export async function saveKycAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = kycSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  let incomeCents: number;
  try {
    incomeCents = parseBrlToCents(parsed.data.monthlyIncome);
  } catch {
    return { error: "Renda mensal inválida." };
  }
  if (incomeCents < 50_000) return { error: "Informe uma renda mensal válida." };

  const data = {
    birthDate: new Date(parsed.data.birthDate),
    motherName: parsed.data.motherName,
    occupation: parsed.data.occupation,
    monthlyIncomeCents: incomeCents,
    zipCode: parsed.data.zipCode,
    street: parsed.data.street,
    number: parsed.data.number,
    complement: parsed.data.complement || null,
    district: parsed.data.district,
    city: parsed.data.city,
    state: parsed.data.state.toUpperCase(),
  };

  await db.kycProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  revalidatePath("/app/verificacao");
  return { ok: "Dados salvos." };
}

export async function uploadDocumentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const type = String(formData.get("type") ?? "") as DocumentType;
  const file = formData.get("file");

  if (!(file instanceof File)) return { error: "Selecione um arquivo." };

  try {
    await storeDocument({ userId: user.id, type, file });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao enviar o arquivo." };
  }

  revalidatePath("/app/verificacao");
  return { ok: "Documento enviado." };
}

export async function addReferenceAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = referenceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const count = await db.personalReference.count({ where: { userId: user.id } });
  if (count >= 4) return { error: "Máximo de quatro referências." };

  await db.personalReference.create({ data: { userId: user.id, ...parsed.data } });
  revalidatePath("/app/verificacao");
  return { ok: "Referência adicionada." };
}

export async function removeReferenceAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await db.personalReference.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/app/verificacao");
}

export async function submitKycAction(
  _state: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  try {
    await submitForReview(user.id, await clientIp());
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível enviar." };
  }
  revalidatePath("/app/verificacao");
  return { ok: "Cadastro enviado para análise." };
}
