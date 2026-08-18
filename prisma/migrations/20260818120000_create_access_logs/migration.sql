-- Trilha de acesso da intranet: navegação de páginas (sempre) e chamadas tRPC
-- lentas ou com erro. Serve para localizar gargalo por rota.
-- Retenção de 30 dias, aplicada por /api/cron/access_logs.

CREATE TYPE "AccessLogKind" AS ENUM ('PAGE_VIEW', 'API_CALL');

CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "kind" "AccessLogKind" NOT NULL,
    "path" TEXT NOT NULL,
    "userId" TEXT,
    "durationMs" INTEGER,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- A trilha sobrevive à remoção do usuário: o vínculo vira NULL em vez de
-- apagar o histórico de acesso.
ALTER TABLE "access_logs"
    ADD CONSTRAINT "access_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- createdAt isolado cobre a limpeza por retenção; os compostos cobrem os
-- filtros da tela de logs (por tipo, por rota, por usuário).
CREATE INDEX "access_logs_createdAt_idx" ON "access_logs"("createdAt");
CREATE INDEX "access_logs_kind_createdAt_idx" ON "access_logs"("kind", "createdAt");
CREATE INDEX "access_logs_path_createdAt_idx" ON "access_logs"("path", "createdAt");
CREATE INDEX "access_logs_userId_createdAt_idx" ON "access_logs"("userId", "createdAt");
