-- Backfill de filial para veículos legados (filialId NULL) criados antes do
-- vínculo veículo→filial. Atribui automaticamente APENAS quando o mapeamento é
-- inequívoco: o `enterprise` legado do veículo corresponde a uma empresa que
-- possui exatamente UMA filial. Casos ambíguos (empresa com várias filiais)
-- permanecem NULL e devem ser ajustados manualmente pelo admin.
UPDATE "vehicles" v
SET "filialId" = sub."filialId"
FROM (
  SELECT f."id" AS "filialId", e."enterprise" AS "enterprise"
  FROM "filiais" f
  JOIN "empresas" e ON e."id" = f."empresaId"
) sub
WHERE v."filialId" IS NULL
  AND v."enterprise" = sub."enterprise"
  AND (
    SELECT COUNT(*)
    FROM "filiais" f2
    JOIN "empresas" e2 ON e2."id" = f2."empresaId"
    WHERE e2."enterprise" = v."enterprise"
  ) = 1;
