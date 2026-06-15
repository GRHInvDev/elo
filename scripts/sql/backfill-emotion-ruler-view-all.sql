-- Backfill (OPCIONAL): marca role_config.can_view_emotion_ruler = true
-- para todos os usuários ativos e não-TOTEM.
--
-- Contexto:
--  * A Régua de Emoções foi liberada para todos os usuários (exceto TOTEM/
--    desativado) via política centralizada em src/lib/access-control.ts
--    (canViewEmotionRuler). A visualização NÃO depende mais deste campo.
--  * Este script é apenas COSMÉTICO: mantém os toggles do editor de permissões
--    (admin/users) coerentes com o novo comportamento público. Não é necessário
--    para que a liberação funcione, e cadastros futuros são cobertos pela política,
--    não por este campo.
--
-- Observações de segurança:
--  * Não toca em usuários TOTEM nem desativados (is_active = false).
--  * "updatedAt" é setado manualmente porque o @updatedAt do Prisma é aplicado
--    na camada da aplicação, não em UPDATEs via SQL puro.
--  * Idempotente: só atualiza quem ainda não tem o campo = true.

-- 1) (Opcional) Conferência antes de aplicar — quantos serão afetados:
-- SELECT COUNT(*) AS users_a_atualizar
-- FROM "users"
-- WHERE "is_active" = true
--   AND COALESCE(("role_config" ->> 'isTotem')::boolean, false) = false
--   AND COALESCE(("role_config" ->> 'can_view_emotion_ruler')::boolean, false) = false;

-- 2) Aplicação do backfill:
UPDATE "users"
SET "role_config" = COALESCE("role_config", '{}'::jsonb)
                    || jsonb_build_object('can_view_emotion_ruler', true),
    "updatedAt"   = NOW()
WHERE "is_active" = true
  AND COALESCE(("role_config" ->> 'isTotem')::boolean, false) = false
  AND COALESCE(("role_config" ->> 'can_view_emotion_ruler')::boolean, false) = false;
