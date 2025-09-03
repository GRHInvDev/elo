-- ================================================================================
-- MIGRAÇÃO RÁPIDA: Sistema de Roles V2 - Configuração Mínima
-- ================================================================================
-- Este script faz a migração completa para o novo sistema de roles granular
-- com configurações mínimas, seguindo o padrão do arquivo role-config.ts
-- ================================================================================

-- 1. Ver usuários atuais e sua situação
SELECT 
  email, 
  firstName, 
  lastName,
  enterprise,
  role_config
FROM users 
ORDER BY email;

-- ================================================================================
-- 2. CONFIGURAÇÃO PADRÃO PARA TODOS OS USUÁRIOS
-- ================================================================================
-- Define configuração mínima baseada no tipo RolesConfig
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_geral", "form_feedback"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": false,
    "can_locate_cars": false
  },
  "isTotem": false
}'::json;

-- ================================================================================
-- 3. CONFIGURAR SUPER ADMIN (SEU USUÁRIO)
-- ================================================================================
-- Define usuário principal como SUDO com acesso total
UPDATE users 
SET role_config = '{
  "sudo": true,
  "admin_pages": null,
  "forms": null,
  "content": null,
  "isTotem": false
}'::json
WHERE email = 'rbueno@boxdistribuidor.com.br';

-- ================================================================================
-- 4. CONFIGURAÇÕES POR EMPRESA (Padrões Básicos)
-- ================================================================================

-- Usuários Box: Permissões mais amplas de criação
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_geral", "form_feedback", "form_box"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": true,
    "can_create_flyer": true,
    "can_create_booking": true,
    "can_locate_cars": false
  },
  "isTotem": false
}'::json
WHERE enterprise = 'Box' 
  AND email != 'rbueno@boxdistribuidor.com.br';

-- Usuários RHenz: Permissões moderadas
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_geral", "form_feedback", "form_rhenz"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": true,
    "can_locate_cars": false
  },
  "isTotem": false
}'::json
WHERE enterprise = 'RHenz' 
  AND email != 'rbueno@boxdistribuidor.com.br';

-- Usuários Cristallux: Permissões básicas
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_geral", "form_feedback", "form_cristallux"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": true,
    "can_locate_cars": false
  },
  "isTotem": false
}'::json
WHERE enterprise = 'Cristallux' 
  AND email != 'rbueno@boxdistribuidor.com.br';

-- ================================================================================
-- 5. CONFIGURAR USUÁRIOS TOTEM
-- ================================================================================
-- Identifica e configura usuários de TOTEM (acesso muito limitado)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": [],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": false,
    "can_locate_cars": false
  },
  "isTotem": true
}'::json
WHERE email LIKE '%totem%' 
   OR firstName LIKE '%Totem%'
   OR firstName LIKE '%TOTEM%';

-- ================================================================================
-- 6. VERIFICAÇÃO DOS RESULTADOS
-- ================================================================================

-- Verificar tipos de usuários configurados
SELECT 
  email,
  firstName,
  lastName,
  enterprise,
  CASE 
    WHEN (role_config->>'sudo')::boolean = true THEN 'SUPER ADMIN'
    WHEN (role_config->>'isTotem')::boolean = true THEN 'USUÁRIO TOTEM'
    WHEN (role_config->'content'->>'can_create_event')::boolean = true 
      OR (role_config->'content'->>'can_create_flyer')::boolean = true THEN 'CRIADOR DE CONTEÚDO'
    ELSE 'USUÁRIO PADRÃO'
  END as tipo_usuario,
  CASE 
    WHEN (role_config->'content'->>'can_create_event')::boolean = true THEN '✅' ELSE '❌'
  END as eventos,
  CASE 
    WHEN (role_config->'content'->>'can_create_flyer')::boolean = true THEN '✅' ELSE '❌'
  END as encartes,
  CASE 
    WHEN (role_config->'content'->>'can_create_booking')::boolean = true THEN '✅' ELSE '❌'
  END as agendamentos,
  CASE 
    WHEN (role_config->'content'->>'can_locate_cars')::boolean = true THEN '✅' ELSE '❌'
  END as carros
FROM users 
ORDER BY 
  CASE 
    WHEN (role_config->>'sudo')::boolean = true THEN 1
    WHEN (role_config->>'isTotem')::boolean = true THEN 3
    ELSE 2
  END,
  enterprise,
  email;

-- Resumo por tipo de usuário
SELECT 
  CASE 
    WHEN (role_config->>'sudo')::boolean = true THEN 'SUPER ADMIN'
    WHEN (role_config->>'isTotem')::boolean = true THEN 'USUÁRIO TOTEM'
    WHEN (role_config->'content'->>'can_create_event')::boolean = true 
      OR (role_config->'content'->>'can_create_flyer')::boolean = true THEN 'CRIADOR DE CONTEÚDO'
    ELSE 'USUÁRIO PADRÃO'
  END as tipo_usuario,
  COUNT(*) as quantidade
FROM users 
GROUP BY 
  CASE 
    WHEN (role_config->>'sudo')::boolean = true THEN 'SUPER ADMIN'
    WHEN (role_config->>'isTotem')::boolean = true THEN 'USUÁRIO TOTEM'
    WHEN (role_config->'content'->>'can_create_event')::boolean = true 
      OR (role_config->'content'->>'can_create_flyer')::boolean = true THEN 'CRIADOR DE CONTEÚDO'
    ELSE 'USUÁRIO PADRÃO'
  END
ORDER BY quantidade DESC;

-- ================================================================================
-- MIGRAÇÃO CONCLUÍDA
-- ================================================================================
-- ✅ Todos os usuários agora têm role_config válido
-- ✅ Seu usuário tem acesso SUDO total
-- ✅ Usuários organizados por empresa com permissões adequadas
-- ✅ Sistema preparado para expansão futura
