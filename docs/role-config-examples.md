# Sistema de Roles Granulares - Guia de Produção

Este documento explica como configurar e usar o sistema de permissões granulares em produção.

## 🚀 **Como Funciona em Produção**

### **1. Provisionamento Automático**
- Usuários são criados automaticamente pelo **webhook do Clerk**
- Dados reais (email, nome, imagem) são sincronizados
- Não há necessidade de seeds manuais

### **2. Configuração de Roles**
- Roles são configurados **após** o usuário existir
- Use a API ou interface admin para configurar permissões
- Configurações são armazenadas em JSON na tabela `role_configs`

## Estrutura do RolesConfig

```typescript
export type RolesConfig = {
  sudo: boolean;                    // Se true, ignora todas as outras verificações
  admin_pages: string[] | undefined; // Array de rotas admin permitidas
  forms: {
    can_create_form: boolean;       // Pode criar formulários
    unlocked_forms: string[];       // IDs dos formulários liberados (legado)
    hidden_forms?: string[];        // IDs dos formulários que devem ficar invisíveis
  } | undefined;
  content: {
    can_create_event: boolean;      // Pode criar eventos
    can_create_flyer: boolean;      // Pode criar encartes
    can_create_booking: boolean;    // Pode fazer agendamentos de salas
  } | undefined;
  isTotem?: boolean;                // Para usuários TOTEM (acesso limitado)
}
```

## Exemplos de Configuração

### 1. Super Admin (Acesso Total)
```json
{
  "sudo": true,
  "admin_pages": undefined,
  "forms": undefined,
  "content": undefined
}
```
**Descrição**: Usuário com acesso completo a todo o sistema.

### 2. Admin de Almoços
```json
{
  "sudo": false,
  "admin_pages": ["/food"],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": []
  }
}
```
**Descrição**: Pode acessar apenas o módulo admin de almoços.

### 3. Admin de Salas + Criador de Formulários
```json
{
  "sudo": false,
  "admin_pages": ["/rooms"],
  "forms": {
    "can_create_form": true,
    "unlocked_forms": []
  }
}
```
**Descrição**: Pode gerenciar salas e criar formulários, mas não tem acesso a formulários específicos.

### 4. Gestor de Ideias + Formulários Específicos
```json
{
  "sudo": false,
  "admin_pages": ["/ideas"],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_id_1", "form_id_2", "form_id_3"]
  }
}
```
**Descrição**: Pode gerenciar ideias e tem acesso apenas aos formulários especificados.

### 5. Usuário com Múltiplos Acessos Admin
```json
{
  "sudo": false,
  "admin_pages": ["/food", "/rooms", "/ideas"],
  "forms": {
    "can_create_form": true,
    "unlocked_forms": ["form_id_1", "form_id_2"]
  }
}
```
**Descrição**: Acesso a múltiplos módulos admin, pode criar formulários e tem acesso a formulários específicos.

### 6. Usuário Apenas Visualizador de Formulários
```json
{
  "sudo": false,
  "admin_pages": [],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_id_1"]
  }
}
```
**Descrição**: Sem acesso admin, apenas pode ver e responder formulário específico.

### 7. Usuário Padrão (Sem Configuração Especial)
```json
{
  "sudo": false,
  "admin_pages": undefined,
  "forms": undefined,
  "content": undefined
}
```
**Descrição**: Usuário comum sem permissões especiais.

### 8. Criador de Conteúdo (Eventos e Encartes)
```json
{
  "sudo": false,
  "admin_pages": undefined,
  "forms": undefined,
  "content": {
    "can_create_event": true,
    "can_create_flyer": true,
    "can_create_booking": false
  }
}
```
**Descrição**: Pode criar eventos e encartes, mas não pode agendar salas.

### 9. Gestor de Salas (Apenas Agendamento)
```json
{
  "sudo": false,
  "admin_pages": ["/rooms"],
  "forms": undefined,
  "content": {
    "can_create_event": false,
    "can_create_flyer": false,
    "can_create_booking": true
  }
}
```
**Descrição**: Pode gerenciar salas administrativamente e fazer agendamentos, mas não criar conteúdo.

### 10. Usuário TOTEM (Acesso Limitado)
```json
{
  "sudo": false,
  "admin_pages": undefined,
  "forms": undefined,
  "content": {
    "can_create_event": true,
    "can_create_flyer": true,
    "can_create_booking": false
  },
  "isTotem": true
}
```
**Descrição**: Usuário TOTEM com acesso limitado apenas a Dashboard, Eventos e Encartes.

### 11. Usuário com Formulários Específicos Ocultos
```json
{
  "sudo": false,
  "admin_pages": undefined,
  "forms": {
    "can_create_form": false,
    "unlocked_forms": [],
    "hidden_forms": ["form_id_1", "form_id_2"]
  },
  "content": undefined
}
```
**Descrição**: Pode ver todos os formulários, exceto os especificados em `hidden_forms`. Os formulários `form_id_1` e `form_id_2` ficarão invisíveis para este usuário.

## Rotas Admin Disponíveis

- `/admin` - Página principal do admin (sempre necessária para acesso)
- `/food` - Gerenciamento de almoços
- `/rooms` - Gerenciamento de salas
- `/ideas` - Gerenciamento de ideias/sugestões
- `/birthday` - Gerenciamento de aniversários
- `/admin/users` - Configuração de usuários (apenas para usuários sudo)

## 🔔 **Sistema de Notificações Inteligente**

O sistema de notificações foi atualizado para respeitar as permissões de cada usuário:

### **Como Funciona:**

1. **Notificações Personalizadas**: Cada usuário só recebe notificações sobre funcionalidades que tem acesso
2. **Filtro Automático**: O sistema filtra automaticamente os destinatários baseado no `role_config`
3. **Privacidade**: Usuários não recebem notificações sobre ações que não podem realizar

### **Tipos de Notificação:**

#### **Posts**
- ✅ Recebem: Usuários com acesso a posts (sudo, TOTEM, ou padrão)
- ❌ Não recebem: Usuários sem role_config ou com restrições específicas

#### **Eventos**
- ✅ Recebem: Usuários com `content.can_create_event: true`
- ❌ Não recebem: Usuários sem permissão para criar eventos

#### **Encartes**
- ✅ Recebem: Usuários com `content.can_create_flyer: true`
- ❌ Não recebem: Usuários sem permissão para criar encartes

#### **Reservas de Sala**
- ✅ Recebem: Usuários com `content.can_create_booking: true`
- ❌ Não recebem: Usuários sem permissão para fazer agendamentos

### **Exemplo de Filtragem:**
```typescript
// Para notificações de eventos, só usuários que podem criar eventos recebem
const usersToNotify = usersWithEventAccess.filter(user => {
  const roleConfig = user.role_config as any;

  // Se é sudo, tem acesso a tudo
  if (roleConfig?.sudo) return true;

  // Verificar se pode criar eventos
  return roleConfig?.content?.can_create_event === true;
});
```

### **Benefícios:**
- 🔒 **Segurança**: Usuários não veem notificações sobre funcionalidades proibidas
- 📊 **Relevância**: Cada usuário recebe apenas notificações relevantes
- ⚡ **Performance**: Menos notificações desnecessárias no sistema
- 🎯 **Experiência**: Interface mais limpa e focada

## 🎯 **Configuração em Produção**

### **Passo 1: Usuário Faz Login**
- Webhook do Clerk cria o usuário automaticamente
- Dados reais são sincronizados (email, nome, imagem)

### **Passo 2: Configurar Permissões**
Use uma das formas abaixo para configurar roles:

#### **A. Via API (Recomendado)**
```typescript
// Como admin, configurar permissões de um usuário
await api.user.updateRoleConfig.mutate({
  userId: "user_id_do_usuario", // ID real do usuário
  roleConfig: {
    sudo: false,
    admin_pages: ["/food", "/rooms"],
    forms: {
      can_create_form: true,
      unlocked_forms: ["form_id_1", "form_id_2"]
    }
  }
});
```

#### **B. Via Interface Admin**
1. Acesse `/admin` como usuário com role `ADMIN`
2. Configure roles via interface (futuramente)
3. Ou use ferramentas de administração do banco

#### **C. Via SQL (Para Emergências)**
```sql
-- Substitua pelos valores reais
INSERT INTO role_configs (id, "userId", config, role, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  u.id,
  '{
    "sudo": false,
    "admin_pages": ["/food"],
    "forms": {
      "can_create_form": false,
      "unlocked_forms": []
    }
  }'::json,
  u.role,
  NOW(),
  NOW()
FROM users u
WHERE u.email = 'usuario@empresa.com'
ON CONFLICT ("userId") DO UPDATE SET
  config = EXCLUDED.config,
  "updatedAt" = NOW();
```

### **Passo 3: Verificar Configuração**
```sql
-- Verificar todas as configurações
SELECT
  u.email,
  u."firstName",
  u."lastName",
  rc.config
FROM users u
LEFT JOIN role_configs rc ON rc."userId" = u.id
ORDER BY u.email;
```

## Como Aplicar Configurações

### Via API (para admins)
```typescript
// Atualizar configuração de um usuário
await api.user.updateRoleConfig.mutate({
  userId: "user_id_here",
  roleConfig: {
    sudo: false,
    admin_pages: ["/food", "/rooms"],
    forms: {
      can_create_form: true,
      unlocked_forms: ["form_1", "form_2"]
    }
  }
});
```

### Diretamente no Banco (para desenvolvimento)
```sql
-- Exemplo: Dar acesso admin de almoços para um usuário
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": ["/food"],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": []
  }
}'
WHERE email = 'usuario@empresa.com';
```

## Verificações de Acesso no Código

### Em Páginas do Servidor
```typescript
import { checkAdminAccess } from "~/lib/access-control";

export default async function AdminFoodPage() {
  await checkAdminAccess("/food");
  // Resto da página...
}
```

### Em Componentes Cliente
```typescript
import { useAccessControl } from "~/hooks/use-access-control";

export default function MyComponent() {
  const { hasAdminAccess, canCreateForm } = useAccessControl();
  
  if (!hasAdminAccess("/food")) {
    return <div>Acesso negado</div>;
  }
  
  return (
    <div>
      {canCreateForm() && <CreateFormButton />}
      {/* resto do componente */}
    </div>
  );
}
```

### Filtrar Formulários
```typescript
import { useAccessControl } from "~/hooks/use-access-control";

export default function FormsList() {
  const { getAccessibleForms } = useAccessControl();
  const allForms = useForms(); // buscar todos os formulários
  
  const accessibleForms = getAccessibleForms(allForms);
  
  return (
    <div>
      {accessibleForms.map(form => <FormCard key={form.id} form={form} />)}
    </div>
  );
}
```

## Notas Importantes

1. **sudo: true** sempre override todas as outras configurações
2. **admin_pages: undefined** significa sem acesso a páginas admin
3. **forms: undefined** significa sem permissões especiais de formulários
4. Arrays vazios **[]** significam "sem acesso" para aquela categoria
5. Para acessar qualquer página admin, o usuário precisa ter acesso à rota `/admin`
6. A verificação é feita tanto no cliente quanto no servidor para máxima segurança
