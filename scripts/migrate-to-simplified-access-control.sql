-- ================================================================================
-- MIGRAÇÃO PARA SISTEMA DE CONTROLE DE ACESSO SIMPLIFICADO
-- ================================================================================
-- Data: Hoje
-- Objetivo: Simplificar o sistema de permissões
-- Regra Nova: TODOS podem VISUALIZAR tudo, apenas alguns podem CRIAR
-- ================================================================================

BEGIN;

-- ================================================================================
-- 1. BACKUP DOS DADOS ATUAIS (Opcional - para rollback)
-- ================================================================================

-- Criar tabela de backup (opcional)
-- CREATE TABLE IF NOT EXISTS users_role_config_backup AS 
-- SELECT id, email, role_config, created_at FROM users WHERE role_config IS NOT NULL;

-- ================================================================================
-- 2. MIGRAR USUÁRIOS SUDO (Admins) - Podem criar tudo
-- ================================================================================

UPDATE users 
SET role_config = jsonb_build_object(
  'sudo', true,
  'admin_pages', ARRAY['/admin', '/food', '/rooms', '/ideas', '/birthday'],
  'can_create_form', true,
  'can_create_event', true,
  'can_create_flyer', true,
  'can_create_booking', true,
  'can_locate_cars', true,
  'isTotem', false
)
WHERE 
  role_config IS NOT NULL 
  AND (
    (role_config->>'sudo')::boolean = true
    OR 
    jsonb_array_length(COALESCE(role_config->'admin_pages', '[]'::jsonb)) > 0
  );

-- ================================================================================
-- 3. MIGRAR USUÁRIOS TOTEM - Acesso limitado
-- ================================================================================

UPDATE users 
SET role_config = jsonb_build_object(
  'sudo', false,
  'admin_pages', '[]'::jsonb,
  'can_create_form', false,
  'can_create_event', false,
  'can_create_flyer', false,
  'can_create_booking', false,
  'can_locate_cars', false,
  'isTotem', true
)
WHERE 
  role_config IS NOT NULL 
  AND (role_config->>'isTotem')::boolean = true;

-- ================================================================================
-- 4. MIGRAR USUÁRIOS COM PERMISSÕES DE CRIAÇÃO ESPECÍFICAS
-- ================================================================================

-- Usuários que tinham permissão para criar eventos
UPDATE users 
SET role_config = jsonb_set(
  COALESCE(role_config, '{}'::jsonb),
  '{can_create_event}',
  'true'::jsonb
)
WHERE 
  role_config IS NOT NULL 
  AND role_config->'content'->>'can_create_event' = 'true'
  AND (role_config->>'sudo')::boolean IS NOT true
  AND (role_config->>'isTotem')::boolean IS NOT true;

-- Usuários que tinham permissão para criar encartes
UPDATE users 
SET role_config = jsonb_set(
  COALESCE(role_config, '{}'::jsonb),
  '{can_create_flyer}',
  'true'::jsonb
)
WHERE 
  role_config IS NOT NULL 
  AND role_config->'content'->>'can_create_flyer' = 'true'
  AND (role_config->>'sudo')::boolean IS NOT true
  AND (role_config->>'isTotem')::boolean IS NOT true;

-- Usuários que tinham permissão para criar agendamentos
UPDATE users 
SET role_config = jsonb_set(
  COALESCE(role_config, '{}'::jsonb),
  '{can_create_booking}',
  'true'::jsonb
)
WHERE 
  role_config IS NOT NULL 
  AND role_config->'content'->>'can_create_booking' = 'true'
  AND (role_config->>'sudo')::boolean IS NOT true
  AND (role_config->>'isTotem')::boolean IS NOT true;

-- Usuários que tinham permissão para alugar carros
UPDATE users 
SET role_config = jsonb_set(
  COALESCE(role_config, '{}'::jsonb),
  '{can_locate_cars}',
  'true'::jsonb
)
WHERE 
  role_config IS NOT NULL 
  AND role_config->'content'->>'can_locate_cars' = 'true'
  AND (role_config->>'sudo')::boolean IS NOT true
  AND (role_config->>'isTotem')::boolean IS NOT true;

-- Usuários que tinham permissão para criar formulários
UPDATE users 
SET role_config = jsonb_set(
  COALESCE(role_config, '{}'::jsonb),
  '{can_create_form}',
  'true'::jsonb
)
WHERE 
  role_config IS NOT NULL 
  AND role_config->'forms'->>'can_create_form' = 'true'
  AND (role_config->>'sudo')::boolean IS NOT true
  AND (role_config->>'isTotem')::boolean IS NOT true;

-- ================================================================================
-- 5. DEFINIR ESTRUTURA PADRÃO PARA USUÁRIOS NORMAIS
-- ================================================================================

-- Usuários que não são sudo nem totem - acesso apenas de visualização
UPDATE users 
SET role_config = jsonb_build_object(
  'sudo', false,
  'admin_pages', '[]'::jsonb,
  'can_create_form', COALESCE((role_config->>'can_create_form')::boolean, false),
  'can_create_event', COALESCE((role_config->>'can_create_event')::boolean, false),
  'can_create_flyer', COALESCE((role_config->>'can_create_flyer')::boolean, false),
  'can_create_booking', COALESCE((role_config->>'can_create_booking')::boolean, false),
  'can_locate_cars', COALESCE((role_config->>'can_locate_cars')::boolean, false),
  'isTotem', false
)
WHERE 
  role_config IS NOT NULL 
  AND (role_config->>'sudo')::boolean IS NOT true
  AND (role_config->>'isTotem')::boolean IS NOT true;

-- ================================================================================
-- 6. CRIAR CONFIGURAÇÃO PADRÃO PARA USUÁRIOS SEM ROLE_CONFIG
-- ================================================================================

-- Usuários sem role_config (visualização apenas)
UPDATE users 
SET role_config = jsonb_build_object(
  'sudo', false,
  'admin_pages', '[]'::jsonb,
  'can_create_form', false,
  'can_create_event', false,
  'can_create_flyer', false,
  'can_create_booking', false,
  'can_locate_cars', false,
  'isTotem', false
)
WHERE role_config IS NULL;

-- ================================================================================
-- 7. CONFIGURAÇÕES ESPECIAIS POR EMPRESA (OPCIONAL)
-- ================================================================================

-- Box - Pode criar eventos e encartes
UPDATE users 
SET role_config = jsonb_set(
  jsonb_set(
    role_config,
    '{can_create_event}',
    'true'::jsonb
  ),
  '{can_create_flyer}',
  'true'::jsonb
)
WHERE 
  enterprise = 'BOX' 
  AND (role_config->>'sudo')::boolean IS NOT true
  AND (role_config->>'isTotem')::boolean IS NOT true;

-- RHenz - Pode criar eventos
UPDATE users 
SET role_config = jsonb_set(
  role_config,
  '{can_create_event}',
  'true'::jsonb
)
WHERE 
  enterprise = 'RHENZ' 
  AND (role_config->>'sudo')::boolean IS NOT true
  AND (role_config->>'isTotem')::boolean IS NOT true;

-- ================================================================================
-- 8. VALIDAÇÃO E LIMPEZA
-- ================================================================================

-- Verificar se todos os usuários têm role_config válido
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role_config IS NOT NULL THEN 1 END) as users_with_config,
  COUNT(CASE WHEN (role_config->>'sudo')::boolean = true THEN 1 END) as sudo_users,
  COUNT(CASE WHEN (role_config->>'isTotem')::boolean = true THEN 1 END) as totem_users
FROM users;

-- Mostrar estatísticas das permissões de criação
SELECT 
  COUNT(CASE WHEN (role_config->>'can_create_form')::boolean = true THEN 1 END) as can_create_forms,
  COUNT(CASE WHEN (role_config->>'can_create_event')::boolean = true THEN 1 END) as can_create_events,
  COUNT(CASE WHEN (role_config->>'can_create_flyer')::boolean = true THEN 1 END) as can_create_flyers,
  COUNT(CASE WHEN (role_config->>'can_create_booking')::boolean = true THEN 1 END) as can_create_bookings,
  COUNT(CASE WHEN (role_config->>'can_locate_cars')::boolean = true THEN 1 END) as can_locate_cars
FROM users 
WHERE role_config IS NOT NULL;

COMMIT;

-- ================================================================================
-- 9. EXEMPLOS DE VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ================================================================================

-- Ver usuários sudo
-- SELECT email, role_config FROM users WHERE (role_config->>'sudo')::boolean = true;

-- Ver usuários que podem criar eventos
-- SELECT email, enterprise, role_config->'can_create_event' as can_create_event 
-- FROM users WHERE (role_config->>'can_create_event')::boolean = true;

-- Ver usuários totem
-- SELECT email, role_config FROM users WHERE (role_config->>'isTotem')::boolean = true;
