-- Migração segura para padronizar 'RECURSOS_HUMANOS' para 'RECURSOS HUMANOS'
-- alinhando com a tabela 'setores' (sem underscore)
BEGIN;

-- 1. Atualiza usuários que estavam com o valor com underscore
UPDATE "users"
SET "setor" = 'RECURSOS HUMANOS', "updatedAt" = NOW()
WHERE "setor" = 'RECURSOS_HUMANOS';

-- 2. Atualiza sugestões que registraram o setor com underscore
UPDATE "Suggestion"
SET "submittedSector" = 'RECURSOS HUMANOS', "updatedAt" = NOW()
WHERE "submittedSector" = 'RECURSOS_HUMANOS';

COMMIT;
