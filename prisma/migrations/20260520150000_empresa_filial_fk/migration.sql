-- Cria tabela de empresas (entidades dinâmicas que agrupam filiais)
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enterprise" "public"."Enterprise" NOT NULL DEFAULT 'Box_Filial',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "empresas_enterprise_idx" ON "empresas"("enterprise");

-- Gera uma empresa padrão para cada enterprise distinto presente nas filiais existentes
INSERT INTO "empresas" ("id", "name", "enterprise", "updatedAt")
SELECT
    'empresa_default_' || LOWER(REPLACE("enterprise"::text, '_', '-')),
    REPLACE("enterprise"::text, '_', ' '),
    "enterprise",
    NOW()
FROM (SELECT DISTINCT "enterprise" FROM "filiais") t
ON CONFLICT DO NOTHING;

-- Adiciona coluna empresaId (nullable durante migração)
ALTER TABLE "filiais" ADD COLUMN "empresaId" TEXT;

-- Vincula cada filial à empresa padrão correspondente ao seu enterprise
UPDATE "filiais"
SET "empresaId" = 'empresa_default_' || LOWER(REPLACE("enterprise"::text, '_', '-'));

-- Torna obrigatória
ALTER TABLE "filiais" ALTER COLUMN "empresaId" SET NOT NULL;

-- Remove coluna e índice antigo
DROP INDEX "filiais_enterprise_idx";
ALTER TABLE "filiais" DROP COLUMN "enterprise";

-- Adiciona FK e índice novo
ALTER TABLE "filiais" ADD CONSTRAINT "filiais_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "filiais_empresaId_idx" ON "filiais"("empresaId");
