-- Enum de tipos de movimentação no cadastro de usuário
CREATE TYPE "public"."UserAuditAction" AS ENUM (
    'BASIC_INFO_UPDATED',
    'PERMISSIONS_UPDATED',
    'DADOS_PRIVADOS_UPDATED',
    'EXTENSION_UPDATED',
    'FILIAL_UPDATED',
    'DEACTIVATED',
    'REACTIVATED'
);

-- Tabela de auditoria de movimentações no cadastro de usuários
CREATE TABLE "user_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changedById" TEXT,
    "action" "public"."UserAuditAction" NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_audit_logs_userId_createdAt_idx" ON "user_audit_logs"("userId", "createdAt");

-- Alvo da movimentação: ao remover o usuário, remove o histórico
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "user_audit_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Autor da movimentação: ao remover o autor, mantém o histórico (seta NULL)
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "user_audit_logs_changedById_fkey"
    FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
