-- Colunas adicionadas ao schema.prisma sem migration correspondente
-- (commit 9625714, modulo de salas). Idempotente: seguro de reaplicar em
-- bancos que ja receberam as colunas via `prisma db push`.
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "visualModel" JSONB;
