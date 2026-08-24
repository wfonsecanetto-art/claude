import { z } from "zod";

/**
 * Validação de entrada.
 *
 * Roda no servidor, sempre. O que o formulário valida no navegador é
 * conveniência para o usuário; a regra que vale é esta.
 */

/** Dígitos verificadores do CPF. Formato correto não basta — o número precisa fechar. */
export function isValidCpf(input: string): boolean {
  const cpf = input.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCpf(cpf: string): string {
  const digits = onlyDigits(cpf);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function maskCpf(cpf: string): string {
  const digits = onlyDigits(cpf);
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

export function formatPhone(phone: string): string {
  const digits = onlyDigits(phone);
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return phone;
}

/** "1.234,56" ou "1234.56" → centavos. */
export function parseBrlToCents(input: string): number {
  const normalized = input
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) throw new Error("Valor inválido");
  return Math.round(value * 100);
}

const cpfSchema = z
  .string()
  .transform(onlyDigits)
  .refine(isValidCpf, "CPF inválido.");

const phoneSchema = z
  .string()
  .transform(onlyDigits)
  .refine((value) => value.length >= 10 && value.length <= 11, "Telefone inválido.");

export const signUpSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  cpf: cpfSchema,
  phone: phoneSchema,
  password: z.string().min(10, "A senha precisa de ao menos 10 caracteres."),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export const kycSchema = z.object({
  birthDate: z.string().refine((value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const age = (Date.now() - date.getTime()) / (365.25 * 86_400_000);
    return age >= 18 && age <= 110;
  }, "É necessário ter 18 anos ou mais."),
  motherName: z.string().trim().min(3, "Informe o nome da mãe.").max(120),
  occupation: z.string().trim().min(2, "Informe sua ocupação.").max(80),
  monthlyIncome: z.string().min(1, "Informe a renda mensal."),
  zipCode: z.string().transform(onlyDigits).refine((v) => v.length === 8, "CEP inválido."),
  street: z.string().trim().min(3, "Informe a rua.").max(120),
  number: z.string().trim().min(1, "Informe o número.").max(12),
  complement: z.string().trim().max(60).optional(),
  district: z.string().trim().min(2, "Informe o bairro.").max(80),
  city: z.string().trim().min(2, "Informe a cidade.").max(80),
  state: z.string().trim().length(2, "Use a sigla do estado (ex.: SP)."),
});

export const referenceSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome da referência.").max(120),
  phone: phoneSchema,
  relationship: z.string().trim().min(2, "Informe o vínculo.").max(40),
});

export const creditApplicationSchema = z.object({
  amount: z.string().min(1, "Informe o valor."),
  termMonths: z.coerce.number().int().min(3).max(24),
  purpose: z.string().trim().min(3, "Descreva a finalidade.").max(120),
});

export const transferSchema = z.object({
  recipient: z.string().trim().min(3, "Informe o e-mail ou CPF do destinatário."),
  amount: z.string().min(1, "Informe o valor."),
  description: z.string().trim().max(80).optional(),
});
