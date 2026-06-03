-- Backfill: vincula colaboradores com enterprise = 'Cristallux_Filial'
-- à filial de id 'cmpxzjlta000gjk04dvipce45'.
--
-- Observações de segurança:
--  * O UPDATE só roda se a filial alvo existir (evita violação de FK e
--    atualização indevida caso o id não exista neste banco).
--  * "updatedAt" é setado manualmente porque o @updatedAt do Prisma é
--    aplicado na camada da aplicação, não em UPDATEs via SQL puro.
--  * Não altera o campo "enterprise" — apenas preenche "filialId".

-- 1) (Opcional) Conferência antes de aplicar — quantos serão afetados:
-- SELECT COUNT(*) AS users_a_atualizar
-- FROM "users"
-- WHERE "enterprise" = 'Cristallux_Filial'
--   AND ("filialId" IS DISTINCT FROM 'cmpxzjlta000gjk04dvipce45');

-- 2) Aplicação do backfill:
UPDATE "users"
SET "filialId"  = 'cmpxzjlta000gjk04dvipce45',
    "updatedAt" = NOW()
WHERE "enterprise" = 'Cristallux_Filial'
  AND EXISTS (
    SELECT 1 FROM "filiais" WHERE "id" = 'cmpxzjlta000gjk04dvipce45'
  );
