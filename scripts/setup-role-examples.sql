-- Script para configurar exemplos de roles granulares
-- Execute após rodar as migrations

-- Exemplo 1: Admin de Almoços
-- Substitua 'email_do_usuario1@empresa.com' pelo email real
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": ["/admin", "/food"],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": []
  }
}'::json
WHERE email = 'email_do_usuario1@empresa.com';

-- Exemplo 2: Gestor de Salas + Criador de Formulários
-- Substitua 'email_do_usuario2@empresa.com' pelo email real
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": ["/admin", "/rooms"],
  "forms": {
    "can_create_form": true,
    "unlocked_forms": []
  }
}'::json
WHERE email = 'email_do_usuario2@empresa.com';

-- Exemplo 3: Gestor de Ideias + Formulários Específicos
-- Substitua 'email_do_usuario3@empresa.com' pelo email real
-- Substitua 'form_id_1', 'form_id_2' pelos IDs reais dos formulários
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": ["/admin", "/ideas"],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_id_1", "form_id_2"]
  }
}'::json
WHERE email = 'email_do_usuario3@empresa.com';

-- Exemplo 4: Super Admin (acesso total)
-- Substitua 'email_do_super_admin@empresa.com' pelo email real
UPDATE users 
SET role_config = '{
  "sudo": true,
  "admin_pages": null,
  "forms": null
}'::json
WHERE email = 'email_do_super_admin@empresa.com';

-- ATUALIZAR configurações existentes
-- Exemplo: Dar acesso total a um usuário específico
UPDATE users 
SET role_config = '{
  "sudo": true,
  "admin_pages": null,
  "forms": null
}'::json
WHERE email = 'usuario@empresa.com';

-- Exemplo: Remover acesso admin mas manter formulários
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": [],
  "forms": {
    "can_create_form": true,
    "unlocked_forms": ["form_id_1", "form_id_2"]
  }
}'::json
WHERE email = 'usuario@empresa.com';

-- Exemplo: Configurar múltiplos acessos
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": ["/admin", "/food", "/rooms"],
  "forms": {
    "can_create_form": true,
    "unlocked_forms": []
  }
}'::json
WHERE email = 'usuario@empresa.com';

-- =================================================================
-- TESTE RÁPIDO - SEU USUÁRIO ESPECÍFICO
-- =================================================================
-- Dar acesso admin completo ao seu usuário para teste
-- IMPORTANTE: Execute estas 3 linhas separadamente para garantir que funcionem:

-- 1. Verificar se usuário existe
SELECT id, email, role, role_config FROM users WHERE email = 'rbueno@boxdistribuidor.com.br';

-- 2. Configurar role_config
UPDATE users 
SET role_config = '{
  "sudo": true,
  "admin_pages": ["/admin", "/food", "/rooms", "/ideas", "/birthday"],
  "forms": {
    "can_create_form": true,
    "unlocked_forms": []
  }
}'::json
WHERE email = 'rbueno@boxdistribuidor.com.br';

-- Verificar se aplicou
SELECT email, role_config FROM users WHERE email = 'rbueno@boxdistribuidor.com.br';

-- =================================================================
-- CONFIGURAÇÕES DE PRODUÇÃO - Não execute seeds hardcoded
-- =================================================================
-- IMPORTANTE: Em produção os usuários são criados automaticamente
-- pelo webhook do Clerk. Use apenas para desenvolvimento local.
--
-- Para produção, configure roles via API ou interface admin:
-- POST /api/trpc/user.updateRoleConfig
-- Body: { "userId": "id_do_usuario", "roleConfig": {...} }
--
-- Ou execute apenas as configurações de role (não o seed de usuários)

-- =================================================================
-- VERIFICAÇÃO DE CONFIGURAÇÕES
-- =================================================================

-- Verificar todas as configurações aplicadas
SELECT
  u.email,
  u."firstName",
  u."lastName",
  u.role_config,
  u."updatedAt"
FROM users u
ORDER BY u.email;

-- Verificar apenas usuários com roles configurados
SELECT
  u.email,
  u."firstName",
  u."lastName",
  u.role_config
FROM users u
WHERE u.role_config IS NOT NULL
ORDER BY u.email;

-- =================================================================
-- NOTAS IMPORTANTES PARA PRODUÇÃO
-- =================================================================
-- 1. Em produção, usuários são criados automaticamente pelo webhook do Clerk
-- 2. Use apenas as configurações de role (INSERT/UPDATE acima)
-- 3. NÃO execute seeds de usuários hardcoded em produção
-- 4. Configure roles via API ou interface admin sempre que possível
-- =================================================================
