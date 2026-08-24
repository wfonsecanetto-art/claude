import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

/**
 * Cria o .env local na primeira instalação.
 *
 * O segredo de sessão é gerado aqui, na máquina de quem instala: um segredo
 * versionado no repositório seria o mesmo para todo mundo, e assinar sessão de
 * produto financeiro com chave pública não é opção. Se o .env já existe, nada
 * é tocado.
 */
if (existsSync(".env")) {
  process.exit(0);
}

const template = existsSync(".env.example") ? readFileSync(".env.example", "utf8") : "";
const secret = randomBytes(32).toString("hex");

const content = template
  .replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET="${secret}"`)
  .replace(/^# Segredo de assinatura.*$/m, "# Segredo gerado na instalação. Não versione este arquivo.")
  .replace(/^#\s+node -e .*$/m, "");

writeFileSync(".env", content || `DATABASE_URL="file:./dev.db"\nAUTH_SECRET="${secret}"\n`);
console.log("✓ .env criado com um AUTH_SECRET novo.");
