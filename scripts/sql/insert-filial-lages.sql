-- Inserir filial Lages vinculada à Box Matriz.
-- Observação: o modelo atual de `filiais` não possui FK para empresa,
-- então o vínculo com Box Matriz é representado no nome/código.

INSERT INTO "filiais" ("id", "name", "code", "createdAt", "updatedAt")
SELECT
  'filial_lages_box_matriz',
  'Lages - Box Matriz',
  'LAGES',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM "filiais"
  WHERE "code" = 'LAGES'
);

