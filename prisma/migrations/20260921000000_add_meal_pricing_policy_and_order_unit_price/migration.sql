-- 1. Criação da tabela de vigência de preços de refeição
CREATE TABLE IF NOT EXISTS "meal_pricing_policies" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "restaurantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_pricing_policies_pkey" PRIMARY KEY ("id")
);

-- 2. Índice para consultas rápidas por faixa de data
CREATE INDEX IF NOT EXISTS "meal_pricing_policies_startDate_endDate_idx" 
ON "meal_pricing_policies"("startDate", "endDate");

-- 3. Foreign key opcional para restaurante
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'meal_pricing_policies_restaurantId_fkey'
    ) THEN
        ALTER TABLE "meal_pricing_policies" 
        ADD CONSTRAINT "meal_pricing_policies_restaurantId_fkey" 
        FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Adicionar coluna unitPrice na tabela food_orders (se ainda não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'food_orders' AND column_name = 'unitPrice'
    ) THEN
        ALTER TABLE "food_orders" ADD COLUMN "unitPrice" DOUBLE PRECISION;
    END IF;
END $$;

-- 5. Inserir políticas de preço padrão (idempotente)
-- Vigência de 20/08 a 31/08: R$ 4,00
INSERT INTO "meal_pricing_policies" ("id", "startDate", "endDate", "price", "description", "updatedAt")
VALUES (
    'policy_2026_08_vigencia_4',
    '2026-08-20 00:00:00.000',
    '2026-08-31 23:59:59.999',
    4.00,
    'Vigência de 20/08 a 31/08: R$ 4,00 por refeição',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE 
SET "startDate" = EXCLUDED."startDate",
    "endDate" = EXCLUDED."endDate",
    "price" = EXCLUDED."price",
    "description" = EXCLUDED."description",
    "updatedAt" = CURRENT_TIMESTAMP;

-- Vigência a partir de 01/09: R$ 7,00 (endDate NULL = vigente)
INSERT INTO "meal_pricing_policies" ("id", "startDate", "endDate", "price", "description", "updatedAt")
VALUES (
    'policy_2026_09_vigencia_7',
    '2026-09-01 00:00:00.000',
    NULL,
    7.00,
    'Vigência a partir de 01/09: R$ 7,00 por refeição',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE 
SET "startDate" = EXCLUDED."startDate",
    "endDate" = EXCLUDED."endDate",
    "price" = EXCLUDED."price",
    "description" = EXCLUDED."description",
    "updatedAt" = CURRENT_TIMESTAMP;

-- 6. Backfill nos pedidos já existentes (FoodOrder.unitPrice):
-- Pedidos com orderDate anterior a 01/09/2026 -> R$ 4,00 (ou o valor gravado no cardápio caso seja diferente de null)
UPDATE "food_orders"
SET "unitPrice" = 4.00
WHERE "orderDate" < '2026-09-01 00:00:00.000'
  AND ("unitPrice" IS NULL OR "unitPrice" != 4.00);

-- Pedidos com orderDate a partir de 01/09/2026 -> R$ 7,00
UPDATE "food_orders"
SET "unitPrice" = 7.00
WHERE "orderDate" >= '2026-09-01 00:00:00.000'
  AND ("unitPrice" IS NULL OR "unitPrice" != 7.00);

-- Caso exista algum pedido com data anterior ao corte que ficou NULL, preenche com o preço do menuItem
UPDATE "food_orders" fo
SET "unitPrice" = COALESCE(mi.price, 4.00)
FROM "menu_items" mi
WHERE fo."menuItemId" = mi.id
  AND fo."unitPrice" IS NULL;

-- 7. Atualizar o preço dos itens de menu ativos para R$ 7,00 (novo valor do cardápio padrão)
UPDATE "menu_items"
SET "price" = 7.00, "updatedAt" = CURRENT_TIMESTAMP
WHERE "price" = 4.00;
