-- =================================================================
-- MIGRAÇÃO: Todos os usuários para configuração USER padrão
-- =================================================================

-- 1. Primeiro, vamos ver quantos usuários temos
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(role_config) as usuarios_com_config,
  COUNT(*) - COUNT(role_config) as usuarios_sem_config
FROM users;

-- 2. Ver alguns exemplos da estrutura atual
SELECT 
  id, 
  email, 
  role_config,
  "createdAt"
FROM users 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- 3. Migrar TODOS os usuários para configuração padrão USER
-- (Exceto se já tiverem role_config customizado)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": [],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": []
  },
  "isTotem": false
}'::json
WHERE role_config IS NULL;

-- 4. Configurar usuário específico como ADMIN (SEU USUÁRIO)
UPDATE users 
SET role_config = '{
  "sudo": true,
  "admin_pages": ["/admin", "/food", "/rooms", "/ideas", "/birthday"],
  "forms": {
    "can_create_form": true,
    "unlocked_forms": []
  },
  "isTotem": false
}'::json
WHERE email = 'rbueno@boxdistribuidor.com.br';

-- 5. Verificar o resultado da migração
SELECT 
  email,
  role_config->>'sudo' as is_sudo,
  role_config->'admin_pages' as admin_pages,
  role_config->'forms'->>'can_create_form' as can_create_form,
  role_config->>'isTotem' as is_totem
FROM users 
WHERE role_config IS NOT NULL
ORDER BY email;

-- 6. Verificar se algum usuário ficou sem configuração
SELECT COUNT(*) as usuarios_sem_config
FROM users 
WHERE role_config IS NULL;

-- 7. Estatísticas finais
SELECT 
  'Total de usuários' as tipo,
  COUNT(*) as quantidade
FROM users
UNION ALL
SELECT 
  'Usuários SUDO' as tipo,
  COUNT(*) as quantidade
FROM users 
WHERE role_config->>'sudo' = 'true'
UNION ALL
SELECT 
  'Usuários normais' as tipo,
  COUNT(*) as quantidade
FROM users 
WHERE role_config->>'sudo' = 'false'
UNION ALL
SELECT 
  'Usuários TOTEM' as tipo,
  COUNT(*) as quantidade
FROM users 
WHERE role_config->>'isTotem' = 'true';
