-- Tabela gerenciável de setores. Fonte da verdade do dropdown/filtro de setor na
-- gestão de usuários. `users.setor` continua sendo string (guarda o `value`).
CREATE TABLE "setores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "setores_name_key" ON "setores"("name");
CREATE UNIQUE INDEX "setores_value_key" ON "setores"("value");

-- Seed dos setores historicamente pré-definidos (antes hardcoded no frontend).
INSERT INTO "setores" ("id", "name", "value", "active", "updatedAt")
VALUES
    ('setor_administrativo',    'Administrativo',            'ADMINISTRATIVO',  true, NOW()),
    ('setor_comercial',         'Comercial',                 'COMERCIAL',       true, NOW()),
    ('setor_financeiro',        'Financeiro',                'FINANCEIRO',      true, NOW()),
    ('setor_recursos_humanos',  'Recursos Humanos',          'RECURSOS_HUMANOS', true, NOW()),
    ('setor_ti',                'Tecnologia da Informação',  'TI',              true, NOW()),
    ('setor_inovacao',          'Inovação',                  'INOVACAO',        true, NOW()),
    ('setor_marketing',         'Marketing',                 'MARKETING',       true, NOW()),
    ('setor_producao',          'Produção',                  'PRODUCAO',        true, NOW()),
    ('setor_compras',           'Compras',                   'COMPRAS',         true, NOW()),
    ('setor_logistica',         'Logística',                 'LOGISTICA',       true, NOW())
ON CONFLICT DO NOTHING;

-- Seed dos setores que já existem cadastrados nos usuários e ainda não constam
-- na tabela (ex.: valores livres criados manualmente). name = value para estes.
INSERT INTO "setores" ("id", "name", "value", "active", "updatedAt")
SELECT
    'setor_' || md5(u."setor"),
    u."setor",
    u."setor",
    true,
    NOW()
FROM (SELECT DISTINCT "setor" FROM "users" WHERE "setor" IS NOT NULL AND "setor" <> '') u
WHERE NOT EXISTS (SELECT 1 FROM "setores" s WHERE s."value" = u."setor")
ON CONFLICT DO NOTHING;
