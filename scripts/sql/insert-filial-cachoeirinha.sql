-- Inserir filial Cachoeirinha vinculada à Cristallux Filial.
-- Observação: o modelo atual de `filiais` não possui FK para empresa,
-- então o vínculo com Cristallux Filial é representado no nome/código.

INSERT INTO "filiais" ("id", "name", "code", "createdAt", "updatedAt")
SELECT
  'filial_cachoeirinha_cristallux',
  'Cachoeirinha - Cristallux Filial',
  'CACHOEIRINHA',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM "filiais"
  WHERE "code" = 'CACHOEIRINHA'
);

