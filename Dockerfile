# Banco Valor Digital — imagem única para rodar a plataforma em qualquer lugar.
#
# Mantém node_modules completo em vez do output "standalone" do Next: o
# cliente do Prisma carrega binários próprios, e a simplicidade de uma imagem
# que apenas funciona vale mais que os megabytes economizados num piloto.

FROM node:22-bookworm-slim

# openssl é requisito do engine do Prisma; ca-certificates para HTTPS de saída.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# As dependências mudam menos que o código: copiadas antes para aproveitar cache.
# prisma/ e scripts/ vêm junto porque o postinstall precisa dos dois.
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY scripts ./scripts
RUN npm ci

# O .env gerado na instalação não vale dentro da imagem: em contêiner, a
# configuração vem do ambiente, e um segredo assado na imagem seria o mesmo
# para toda cópia dela.
RUN rm -f .env

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Banco e documentos ficam em volume: precisam sobreviver ao contêiner.
ENV DATABASE_URL="file:/app/data/valor.db"

RUN npm run build

VOLUME ["/app/data", "/app/storage"]
EXPOSE 3000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
