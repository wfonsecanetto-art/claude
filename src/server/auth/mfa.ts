import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

/**
 * Segundo fator por TOTP (RFC 6238) — compatível com Google Authenticator,
 * Authy, 1Password e afins. Nada de SMS: SIM swap é vetor conhecido em fraude
 * financeira no Brasil.
 */

/** Tolerância de 30s para cada lado, cobrindo relógio dessincronizado. */
const EPOCH_TOLERANCE_SECONDS = 30;

export function generateMfaSecret(): string {
  return generateSecret();
}

export function buildOtpAuthUrl(email: string, secret: string): string {
  return generateURI({
    issuer: "Banco Valor Digital",
    label: email,
    secret,
  });
}

export async function verifyMfaToken(token: string, secret: string): Promise<boolean> {
  try {
    const result = await verify({
      secret,
      token: token.replace(/\s/g, ""),
      epochTolerance: EPOCH_TOLERANCE_SECONDS,
    });
    return result.valid;
  } catch {
    return false;
  }
}

export function renderQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl, {
    margin: 1,
    width: 240,
    color: { dark: "#050505", light: "#b7ff00" },
  });
}
