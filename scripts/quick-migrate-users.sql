-- ===================================================
-- MIGRAÇÃO RÁPIDA: Todos usuários para configuração padrão
-- ===================================================

-- 1. Ver usuários atuais
SELECT id, email, role_config FROM users ORDER BY email;

-- 2. Migrar TODOS para configuração padrão USER
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": [],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": []
  },
  "isTotem": false
}'::json;

-- 3. Configurar SEU usuário como SUPER ADMIN
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

-- 4. Verificar resultado
SELECT 
  email,
  role_config->>'sudo' as is_sudo,
  CASE 
    WHEN role_config->>'sudo' = 'true' THEN 'SUPER ADMIN'
    WHEN role_config->>'isTotem' = 'true' THEN 'TOTEM'
    ELSE 'USER NORMAL'
  END as tipo_usuario
FROM users 
ORDER BY email;
