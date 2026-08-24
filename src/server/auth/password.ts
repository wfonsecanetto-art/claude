import bcrypt from "bcryptjs";

/**
 * Hash de senha com bcrypt.
 *
 * Custo 12: cerca de 250ms por verificação em hardware comum — caro o
 * suficiente para inviabilizar força bruta em massa, rápido o suficiente para
 * não travar o login.
 */
const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type PasswordStrength = { valid: boolean; problems: string[] };

/** Requisitos mínimos de senha, verificados no servidor. */
export function checkPasswordStrength(password: string): PasswordStrength {
  const problems: string[] = [];
  if (password.length < 10) problems.push("Use ao menos 10 caracteres.");
  if (!/[a-z]/.test(password)) problems.push("Inclua uma letra minúscula.");
  if (!/[A-Z]/.test(password)) problems.push("Inclua uma letra maiúscula.");
  if (!/[0-9]/.test(password)) problems.push("Inclua um número.");
  return { valid: problems.length === 0, problems };
}
