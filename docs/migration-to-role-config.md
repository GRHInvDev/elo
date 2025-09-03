# Migração para Sistema de Roles Granulares

## ✅ **Migração Completa Concluída**

O sistema foi **completamente migrado** do modelo antigo (enum UserRole) para o novo sistema de roles granulares baseado em `role_config`.

### **🗑️ Removido:**
- ❌ Enum `UserRole` (ADMIN, USER, TOTEM)
- ❌ Campo `role` na tabela `users`
- ❌ Dependências do sistema antigo

### **🆕 Novo Sistema:**
- ✅ Campo `role_config: Json?` na tabela `users`
- ✅ Tipo `RolesConfig` em TypeScript
- ✅ Navegação baseada em `role_config`
- ✅ Webhook do Clerk atualizado

## **🚀 Como Usar Agora:**

### **1. Estrutura do role_config:**
```json
{
  "sudo": true,                    // Acesso total (super admin)
  "admin_pages": ["/admin", "/food"], // Páginas admin específicas
  "forms": {
    "can_create_form": true,       // Pode criar formulários
    "unlocked_forms": ["id1", "id2"] // Formulários específicos liberados
  },
  "isTotem": false                 // Usuário TOTEM (acesso limitado)
}
```

### **2. Configurar Usuário Admin:**
```sql
UPDATE users 
SET role_config = '{
  "sudo": true,
  "admin_pages": ["/admin", "/food", "/rooms", "/ideas", "/birthday"],
  "forms": {
    "can_create_form": true,
    "unlocked_forms": []
  }
}'::json
WHERE email = 'usuario@empresa.com';
```

### **3. Configurar Usuário TOTEM:**
```sql
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": undefined,
  "forms": undefined,
  "isTotem": true
}'::json
WHERE email = 'totem@empresa.com';
```

### **4. Configurar Usuário com Acesso Específico:**
```sql
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": ["/admin", "/food"],
  "forms": {
    "can_create_form": false,
    "unlocked_forms": ["form_id_1"]
  }
}'::json
WHERE email = 'usuario_especifico@empresa.com';
```

## **🔧 API Atualizada:**

### **Verificação de Permissões:**
```typescript
// ANTES (sistema antigo)
if (user.role === 'ADMIN') { /* acesso admin */ }

// DEPOIS (novo sistema)
const hasAdminAccess = user.role_config?.sudo || 
                      user.role_config?.admin_pages?.includes("/admin");
```

### **Hook useAccessControl:**
```typescript
const { hasAdminAccess, canCreateForm, isSudo } = useAccessControl();

if (hasAdminAccess("/food")) {
  // Usuário pode acessar admin de almoços
}
```

### **Navegação Dinâmica:**
```typescript
// Navegar baseado em role_config
const routes = routeItems(user.role_config);
```

## **🛡️ Controle de Acesso:**

### **Páginas do Servidor:**
```typescript
export default async function AdminPage() {
  await checkAdminAccess("/admin");
  // Página protegida
}
```

### **Componentes Cliente:**
```typescript
export default function MyComponent() {
  const { hasAdminAccess } = useAccessControl();
  
  if (!hasAdminAccess("/food")) {
    return <AccessDenied />;
  }
  
  return <AdminFoodComponent />;
}
```

## **📝 Migração de Dados:**

### **Para Aplicar a Migration:**
```bash
npx prisma migrate dev --name remove_user_role_enum
# ou
npx prisma db push
```

### **Script de Migração de Dados Existentes:**
```sql
-- Migrar usuários ADMIN existentes
UPDATE users 
SET role_config = '{
  "sudo": true,
  "admin_pages": ["/admin", "/food", "/rooms", "/ideas", "/birthday"],
  "forms": {
    "can_create_form": true,
    "unlocked_forms": []
  }
}'::json
WHERE role = 'ADMIN';

-- Migrar usuários USER normais
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": undefined,
  "forms": undefined
}'::json
WHERE role = 'USER' AND role_config IS NULL;

-- Migrar usuários TOTEM
UPDATE users 
SET role_config = '{
  "sudo": false,
  "admin_pages": undefined,
  "forms": undefined,
  "isTotem": true
}'::json
WHERE role = 'TOTEM';
```

## **🎯 Benefícios do Novo Sistema:**

1. **✅ Flexibilidade Total**: Configurações granulares por usuário
2. **✅ Escalabilidade**: Fácil adicionar novos tipos de permissão
3. **✅ Manutenção**: Configuração via API ou SQL
4. **✅ Performance**: Uma consulta resolve todas as permissões
5. **✅ Auditoria**: Todas as mudanças ficam registradas
6. **✅ Simplicidade**: Uma estrutura unificada

## **🚨 Pontos de Atenção:**

1. **Backup**: Faça backup antes de aplicar a migration
2. **Testes**: Teste todas as funcionalidades após a migração
3. **Webhook**: Configure metadados no Clerk para novos usuários
4. **Documentação**: Atualize equipe sobre novo sistema

---

**O sistema agora é 100% baseado em role_config e muito mais flexível! 🎉**
