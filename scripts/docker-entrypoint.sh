#!/bin/sh
set -e

# Preparação de um contêiner novo: diretórios de dados, migrações e, na
# primeira subida, a carga inicial. Rodar migrate a cada start é intencional —
# é o que mantém uma imagem nova compatível com um volume antigo.

mkdir -p /app/data /app/storage/documents

if [ -z "$AUTH_SECRET" ]; then
  export AUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  echo "AVISO: AUTH_SECRET não foi informado; um valor temporário foi gerado."
  echo "       As sessões caem a cada reinício. Em uso real, passe o seu:"
  echo "       docker run -e AUTH_SECRET=... "
fi

echo "→ Aplicando migrações…"
npx prisma migrate deploy

# Semeia apenas se o banco estiver vazio: reiniciar o contêiner não pode
# apagar o que o usuário criou.
USERS=$(node -e "
const { PrismaClient } = require('@prisma/client');
new PrismaClient().user.count()
  .then((n) => { console.log(n); process.exit(0); })
  .catch(() => { console.log(0); process.exit(0); });
")

if [ "$USERS" = "0" ]; then
  echo "→ Banco vazio: carregando ambiente inicial…"
  npm run db:seed
else
  echo "→ Banco já tem $USERS usuários; seed ignorado."
fi

echo "→ Subindo em http://localhost:3000"
exec npm run start -- --hostname 0.0.0.0
