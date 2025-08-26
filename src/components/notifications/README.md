# Sistema de Notificações

Este módulo fornece um sistema completo de notificações para a aplicação, com integração nativa ao sistema de sugestões e extensibilidade para outros módulos.

## 🏗️ Arquitetura

### Componentes Principais

#### Backend
- **`notification.ts`** - Router tRPC com todas as operações CRUD
- **Modelos Prisma** - `Notification`, `NotificationPreference`
- **Serviço** - `notification-service.ts` com métodos utilitários

#### Frontend
- **`notification-item.tsx`** - Componente individual de notificação
- **`notification-list.tsx`** - Lista completa de notificações
- **`notification-dropdown.tsx`** - Dropdown no header
- **`notification-preferences.tsx`** - Gerenciamento de preferências

## 📊 Modelos de Dados

### Notification
```prisma
model Notification {
  id          String             @id @default(cuid())
  title       String
  message     String
  type        NotificationType   @default(INFO)
  channel     NotificationChannel @default(IN_APP)
  isRead      Boolean            @default(false)
  data        Json?              // Dados adicionais
  userId      String
  entityId    String?            // ID da entidade relacionada
  entityType  String?            // Tipo da entidade
  actionUrl   String?            // URL para redirecionar
  user        User               @relation
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
}
```

### NotificationPreference
```prisma
model NotificationPreference {
  id                   String   @id @default(cuid())
  userId               String   @unique
  emailNotifications   Boolean  @default(true)
  pushNotifications    Boolean  @default(true)
  suggestionUpdates    Boolean  @default(true)
  systemNotifications  Boolean  @default(true)
  user                 User     @relation
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

## 🎯 Tipos de Notificação

- **INFO** - Informações gerais
- **SUCCESS** - Ações bem-sucedidas
- **WARNING** - Avisos importantes
- **ERROR** - Erros e problemas
- **SUGGESTION_CREATED** - Nova sugestão criada
- **SUGGESTION_UPDATED** - Sugestão atualizada
- **SUGGESTION_APPROVED** - Sugestão aprovada
- **SUGGESTION_REJECTED** - Sugestão rejeitada
- **KPI_ADDED** - KPI adicionado
- **CLASSIFICATION_UPDATED** - Classificação atualizada
- **COMMENT_ADDED** - Comentário adicionado
- **SYSTEM_MAINTENANCE** - Manutenção do sistema

## 🚀 Como Usar

### 1. Criar Notificação Simples
```typescript
import { NotificationService } from '@/lib/notification-service'

await NotificationService.notifySuccess(
  userId,
  'Operação Concluída',
  'Sua solicitação foi processada com sucesso.'
)
```

### 2. Criar Notificação com Entidade
```typescript
await NotificationService.notifySuggestionApproved(
  suggestionId,
  authorId,
  suggestionNumber
)
```

### 3. Criar Notificações em Lote
```typescript
await NotificationService.createBulkNotification({
  title: 'Manutenção do Sistema',
  message: 'O sistema ficará indisponível hoje às 22h',
  userIds: allUserIds,
  type: 'SYSTEM_MAINTENANCE'
})
```

### 4. Usar em Componentes React
```tsx
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'

function MyComponent() {
  const { unreadCount, markAsRead } = useNotifications()

  return (
    <header>
      <NotificationDropdown />
      <span>{unreadCount} notificações</span>
    </header>
  )
}
```

## 🔧 Integração com Sugestões

O sistema já está integrado automaticamente com:

### Criação de Sugestões
- ✅ Notificação criada quando usuário cria uma sugestão

### Atualização de Status
- ✅ Notificação quando sugestão é aprovada
- ✅ Notificação quando sugestão é rejeitada
- ✅ Notificação quando status é alterado

### Classificações
- ✅ Notificação quando impacto/capacidade/esforço são atualizados

### KPIs
- ✅ Notificação quando KPIs são adicionados (via backend)

## 📈 Extensibilidade

### Adicionar Novos Tipos
1. Adicione ao enum `NotificationType` no schema
2. Atualize os ícones no `notification-item.tsx`
3. Crie métodos específicos no `NotificationService`

### Integrar Novo Módulo
```typescript
// 1. Importar o serviço
import { NotificationService } from '@/lib/notification-service'

// 2. Criar notificações nos pontos apropriados
await NotificationService.createNotification({
  title: 'Novo Pedido',
  message: `Pedido #${orderNumber} foi criado`,
  type: 'INFO',
  userId: customerId,
  entityId: orderId,
  entityType: 'order',
  actionUrl: `/orders/${orderId}`
})
```

## 🎨 Personalização

### Estilos
Os estilos são baseados em Tailwind CSS e podem be personalizados através das classes CSS.

### Ícones
Os ícones são emojis baseados no tipo de notificação, mas podem ser substituídos por ícones do Lucide React.

### Cores
As cores seguem um padrão baseado no tipo:
- **SUCCESS**: Verde
- **ERROR**: Vermelho
- **WARNING**: Amarelo
- **INFO**: Azul
- **SUGGESTION_***: Azul/variantes

### 📢 Sistema de Som

O sistema de notificações suporta arquivos de som personalizados:

#### Como adicionar um arquivo de som:

1. **Localização**: `public/notification-sound.mp3`
2. **Formato recomendado**: MP3
3. **Duração ideal**: 1-2 segundos
4. **Volume**: Médio (sistema ajusta automaticamente para 40%)

#### Características do som atual:

- **Arquivo principal**: `public/notification-sound.mp3`
- **Fallback**: Som gerado programaticamente (se arquivo não existir)
- **Volume**: 40% do volume máximo
- **Preload**: Automático
- **Eventos**: Tocado quando nova notificação chega e som está habilitado

#### Testando o som:

O som é tocado automaticamente quando:
- Uma nova notificação chega
- A configuração de som está habilitada
- O usuário tem a aba do navegador ativa

#### Personalização:

Para alterar o arquivo de som, simplesmente substitua `public/notification-sound.mp3` por seu arquivo personalizado.

## 🔍 Boas Práticas

1. **Sempre use try/catch** ao criar notificações para não quebrar operações principais
2. **Inclua entityId/entityType** para navegação contextual
3. **Use tipos específicos** ao invés de genéricos quando possível
4. **Prefira notificações em lote** para múltiplos usuários
5. **Teste as notificações** em diferentes cenários

## 🐛 Debugging

### Logs de Debug
```typescript
// Habilite logs no console para debug
console.log('Notificação criada:', {
  userId,
  type,
  entityId,
  entityType
})
```

### Verificar no Banco
```sql
-- Ver todas as notificações de um usuário
SELECT * FROM notifications WHERE "userId" = 'user-id' ORDER BY "createdAt" DESC;

-- Ver notificações não lidas
SELECT * FROM notifications WHERE "userId" = 'user-id' AND "isRead" = false;
```

## 📚 Exemplos Completos

Veja `src/lib/notification-examples.ts` para exemplos completos de uso em diferentes cenários.

## 🔄 Próximos Passos

- [ ] Implementar notificações por email
- [ ] Adicionar notificações push (browser)
- [ ] Criar página completa de notificações
- [ ] Adicionar filtros e busca
- [ ] Implementar notificações em tempo real (WebSocket)
- [ ] Adicionar testes automatizados

---

**Criado por:** Sistema de Notificações Modular
**Versão:** 1.0.0
**Data:** 2024
