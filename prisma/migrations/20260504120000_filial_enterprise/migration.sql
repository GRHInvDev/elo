-- Filial vinculada à empresa (Enterprise)
ALTER TABLE "filiais" ADD COLUMN "enterprise" "public"."Enterprise" NOT NULL DEFAULT 'Box_Filial';

CREATE INDEX "filiais_enterprise_idx" ON "filiais"("enterprise");
