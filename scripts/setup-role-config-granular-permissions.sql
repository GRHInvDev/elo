-- ================================================================================
-- SCRIPT DE CONFIGURAÇÃO GRANULAR - ROLE CONFIG V2
-- Sistema de Permissões Granulares com Visualização vs Ação
-- ================================================================================

-- Este script configura usuários com permissões granulares separando:
-- - VISUALIZAÇÃO: Acesso para ver páginas/conteúdo
-- - AÇÃO: Permissão para criar/modificar conteúdo

-- ================================================================================
-- CONCEITO DO SISTEMA GRANULAR:
-- ================================================================================
-- 1. VISUALIZAÇÃO (can_view_*): Todos podem ver, mas nem todos podem agir
-- 2. AÇÃO (can_create_*, can_locate_*): Apenas usuários específicos podem criar/modificar
-- 3. FORMULÁRIOS: Baseado em listas de desbloqueio/ocultação

-- ================================================================================
-- 1. SUPER ADMINS (Acesso Total ao Sistema)
-- ================================================================================

-- Super Admin Principal
UPDATE users 
SET role_config = '{
  "sudo": true,
  "admin_pages": null,
  "forms": null,
  "content": null,
  "isTotem": false
}'::json
WHERE email = 'admin@gruprhenz.com.br';

-- Backup Super Admin
UPDATE users 
SET role_config = '{
  "sudo": true,
  "admin_pages": null,
  "forms": null,
  "content": null,
  "isTotem": false
}'::json
WHERE email = 'backup.admin@gruprhenz.com.br';

-- ================================================================================
-- 2. ADMINS ESPECIALIZADOS (Módulos Específicos + Criação de Conteúdo)
-- ================================================================================

-- Admin de Almoços (Food Management + Criação de Conteúdo)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": ["/admin", "/food"],
  "forms": {
    "can_create_form": true,
    "unlocked_forms": ["form_alimentacao", "form_cardapio", "form_pedidos"],
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
WHERE email = 'alimentacao@gruprhenz.com.br';

-- Admin de Salas e Eventos (Room + Event Management)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": ["/admin", "/rooms"],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_reserva_sala", "form_evento"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": true,
    "can_create_flyer": false,
    "can_create_booking": true,
    "can_locate_cars": false
  },
  "isTotem": false
}'::json
WHERE email = 'eventos@gruprhenz.com.br';

-- Admin de Veículos e Transportes
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": ["/admin"],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_veiculo", "form_manutencao"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": false,
    "can_locate_cars": true
  },
  "isTotem": false
}'::json
WHERE email = 'veiculos@gruprhenz.com.br';

-- ================================================================================
-- 3. CRIADORES DE CONTEÚDO ESPECÍFICO
-- ================================================================================

-- Especialista em Eventos (Criação de Eventos)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_evento", "form_participacao"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": true,
    "can_create_flyer": false,
    "can_create_booking": false,
    "can_locate_cars": false
  },
  "isTotem": false
}'::json
WHERE email IN (
  'eventos.criador@gruprhenz.com.br',
  'organizacao@gruprhenz.com.br'
);

-- Especialista em Marketing (Criação de Encartes)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_marketing", "form_promocao"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": true,
    "can_create_booking": false,
    "can_locate_cars": false
  },
  "isTotem": false
}'::json
WHERE email IN (
  'marketing@gruprhenz.com.br',
  'comunicacao@gruprhenz.com.br'
);

-- Responsável por Agendamentos de Salas
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_reserva_sala", "form_equipamentos"],
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
WHERE email IN (
  'recepção@gruprhenz.com.br',
  'facilities@gruprhenz.com.br'
);

-- Responsável por Veículos (Locação de Carros)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_veiculo", "form_solicitacao_transporte"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": false,
    "can_locate_cars": true
  },
  "isTotem": false
}'::json
WHERE email IN (
  'transportes@gruprhenz.com.br',
  'logistica@gruprhenz.com.br',
  'frota@gruprhenz.com.br'
);

-- ================================================================================
-- 4. USUÁRIOS COM FORMULÁRIOS ESPECÍFICOS (Sem Criação de Conteúdo)
-- ================================================================================

-- Setor Financeiro (Formulários específicos)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_financeiro", "form_orcamento", "form_compras", "form_reembolso"],
    "hidden_forms": ["form_rh_confidencial", "form_diretoria", "form_ti_interno"]
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": false,
    "can_locate_cars": false
  },
  "isTotem": false
}'::json
WHERE setor = 'FINANCEIRO';

-- Setor de RH (Formulários específicos + formulários ocultos)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_rh", "form_ferias", "form_ponto", "form_treinamento"],
    "hidden_forms": ["form_financeiro_confidencial", "form_diretoria"]
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": false,
    "can_locate_cars": false
  },
  "isTotem": false
}'::json
WHERE setor = 'RH';

-- Setor de TI (Formulários técnicos)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_ti", "form_suporte", "form_equipamento", "form_sistema"],
    "hidden_forms": ["form_rh_confidencial", "form_financeiro_confidencial"]
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": false,
    "can_locate_cars": false
  },
  "isTotem": false
}'::json
WHERE setor = 'TI';

-- Setor de Logística (Acesso a veículos)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_logistica", "form_entrega", "form_transporte"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": true,
    "can_locate_cars": true
  },
  "isTotem": false
}'::json
WHERE setor = 'LOGISTICA';

-- Setor Administrativo (Acesso a salas)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_administrativo", "form_suprimentos"],
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
WHERE setor = 'ADMINISTRATIVO' 
  AND enterprise != 'NA';

-- ================================================================================
-- 5. USUÁRIOS TOTEM (Acesso Limitado)
-- ================================================================================

-- Usuários TOTEM (Visualização apenas)
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
-- 6. CONFIGURAÇÕES POR EMPRESA (Permissões Baseadas na Empresa)
-- ================================================================================

-- Usuários Box (Criação Completa de Conteúdo)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_box", "form_geral", "form_feedback"],
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
  AND role_config IS NULL;

-- Usuários Cristallux (Criação de Conteúdo)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_cristallux", "form_geral"],
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
WHERE enterprise = 'Cristallux' 
  AND role_config IS NULL;

-- ================================================================================
-- 7. USUÁRIOS PADRÃO (Apenas Visualização)
-- ================================================================================

-- Usuários padrão sem permissões específicas (apenas visualização)
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
}'::json
WHERE role_config IS NULL 
  AND email NOT LIKE '%admin%'
  AND email NOT LIKE '%totem%';

-- ================================================================================
-- 8. EXEMPLOS DE USUÁRIOS ESPECÍFICOS
-- ================================================================================

-- Usuário multifuncional (Eventos + Encartes + Agendamentos)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": true,
    "unlocked_forms": ["form_evento", "form_marketing", "form_reserva"],
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
WHERE email = 'coordenacao@gruprhenz.com.br';

-- Gerente de frota (Veículos + Agendamentos)
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": null,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_veiculo", "form_manutencao", "form_reserva_sala"],
    "hidden_forms": []
  },
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": true,
    "can_locate_cars": true
  },
  "isTotem": false
}'::json
WHERE email = 'gerente.frota@gruprhenz.com.br';

-- ================================================================================
-- 9. CONSULTAS DE VERIFICAÇÃO
-- ================================================================================

-- Consulta para verificar tipos de usuários
SELECT 
  u.email,
  u.firstName,
  u.lastName,
  u.enterprise,
  u.setor,
  CASE 
    WHEN (u.role_config->>'sudo')::boolean = true THEN 'SUPER ADMIN'
    WHEN u.role_config->'admin_pages' IS NOT NULL THEN 'ADMIN ESPECIALIZADO'
    WHEN u.role_config->'content' IS NOT NULL AND (
      (u.role_config->'content'->>'can_create_event')::boolean = true OR
      (u.role_config->'content'->>'can_create_flyer')::boolean = true OR
      (u.role_config->'content'->>'can_create_booking')::boolean = true OR
      (u.role_config->'content'->>'can_locate_cars')::boolean = true
    ) THEN 'CRIADOR DE CONTEÚDO'
    WHEN (u.role_config->>'isTotem')::boolean = true THEN 'USUÁRIO TOTEM'
    ELSE 'USUÁRIO PADRÃO (VISUALIZAÇÃO)'
  END as tipo_usuario,
  CASE 
    WHEN (u.role_config->'content'->>'can_create_event')::boolean = true THEN 'SIM' ELSE 'NÃO'
  END as pode_criar_eventos,
  CASE 
    WHEN (u.role_config->'content'->>'can_create_flyer')::boolean = true THEN 'SIM' ELSE 'NÃO'
  END as pode_criar_encartes,
  CASE 
    WHEN (u.role_config->'content'->>'can_create_booking')::boolean = true THEN 'SIM' ELSE 'NÃO'
  END as pode_agendar_salas,
  CASE 
    WHEN (u.role_config->'content'->>'can_locate_cars')::boolean = true THEN 'SIM' ELSE 'NÃO'
  END as pode_agendar_carros,
  u.role_config
FROM users u
WHERE u.role_config IS NOT NULL
ORDER BY 
  CASE 
    WHEN (u.role_config->>'sudo')::boolean = true THEN 1
    WHEN u.role_config->'admin_pages' IS NOT NULL THEN 2
    WHEN u.role_config->'content' IS NOT NULL THEN 3
    WHEN (u.role_config->>'isTotem')::boolean = true THEN 4
    ELSE 5
  END,
  u.email;

-- Consulta para verificar usuários com cada permissão específica
SELECT 
  'CRIAR EVENTOS' as permissao,
  COUNT(*) as total_usuarios
FROM users 
WHERE (role_config->'content'->>'can_create_event')::boolean = true

UNION ALL

SELECT 
  'CRIAR ENCARTES' as permissao,
  COUNT(*) as total_usuarios
FROM users 
WHERE (role_config->'content'->>'can_create_flyer')::boolean = true

UNION ALL

SELECT 
  'AGENDAR SALAS' as permissao,
  COUNT(*) as total_usuarios
FROM users 
WHERE (role_config->'content'->>'can_create_booking')::boolean = true

UNION ALL

SELECT 
  'AGENDAR CARROS' as permissao,
  COUNT(*) as total_usuarios
FROM users 
WHERE (role_config->'content'->>'can_locate_cars')::boolean = true

UNION ALL

SELECT 
  'CRIAR FORMULÁRIOS' as permissao,
  COUNT(*) as total_usuarios
FROM users 
WHERE (role_config->'forms'->>'can_create_form')::boolean = true;

-- ================================================================================
-- SCRIPT CONCLUÍDO
-- ================================================================================

-- RESUMO DO SISTEMA GRANULAR:
-- 
-- 1. VISUALIZAÇÃO UNIVERSAL:
--    - Todos podem ver: Eventos, Encartes, Shop, Carros, Formulários
--    - Formulários: TODOS podem ver TODOS os formulários, exceto os hidden_forms
--
-- 2. AÇÕES ESPECÍFICAS:
--    - can_create_event: Criar eventos
--    - can_create_flyer: Criar encartes  
--    - can_create_booking: Agendar salas
--    - can_locate_cars: Agendar carros
--    - can_create_form: Criar formulários
--
-- 3. CONTROLE DE VISIBILIDADE:
--    - hidden_forms: Lista de formulários ocultos por usuário (configurável via Admin)
--    - unlocked_forms: Mantido por compatibilidade (não usado na nova lógica)
--
-- 4. INTERFACE ADAPTATIVA:
--    - Botões de ação aparecem apenas para quem tem permissão
--    - Mensagens contextuais baseadas nas permissões
--    - Experiência personalizada por usuário
--    - Admins sudo podem gerenciar formulários ocultos na página Users
--
-- 5. PÁGINAS ADMINISTRATIVAS:
--    - /admin: Dashboard principal (acesso via admin_pages)
--    - /admin/users: Gerenciar usuários e permissões (APENAS SUDO)
--    - /admin/rooms: Gerenciar salas
--    - /admin/birthday: Gerenciar aniversários
--    - /admin/food: Gerenciar pedidos de almoço
--    - /admin/suggestions: Gerenciar ideias/sugestões
--
-- Execute este script em produção para implementar o sistema completo!
