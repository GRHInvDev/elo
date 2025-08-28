// Exemplos de uso do Sistema de Notificações
// Este arquivo serve como referência para implementar notificações em diferentes partes do sistema

import { NotificationService } from './notification-service'

// 1. Notificações de Ideias
export const suggestionNotificationExamples = {
  // Quando uma Ideia é criada
  onSuggestionCreated: async (suggestionId: string, authorId: string, suggestionNumber: number) => {
    await NotificationService.notifySuggestionCreated(suggestionId, authorId, suggestionNumber)
  },

  // Quando uma Ideia é aprovada
  onSuggestionApproved: async (suggestionId: string, authorId: string, suggestionNumber: number) => {
    await NotificationService.notifySuggestionApproved(suggestionId, authorId, suggestionNumber)
  },

  // Quando uma Ideia é rejeitada
  onSuggestionRejected: async (suggestionId: string, authorId: string, suggestionNumber: number, reason?: string) => {
    await NotificationService.notifySuggestionRejected(suggestionId, authorId, suggestionNumber, reason)
  },

  // Quando uma Ideia é atualizada
  onSuggestionUpdated: async (suggestionId: string, authorId: string, suggestionNumber: number) => {
    await NotificationService.notifySuggestionUpdated(suggestionId, authorId, suggestionNumber)
  }
}

// 2. Notificações de KPIs
export const kpiNotificationExamples = {
  // Quando KPIs são adicionados a uma Ideia
  onKpiAdded: async (suggestionId: string, authorId: string, kpiName: string) => {
    await NotificationService.notifyKpiAdded(suggestionId, authorId, kpiName)
  }
}

// 3. Notificações de Sistema
export const systemNotificationExamples = {
  // Notificação de manutenção
  onSystemMaintenance: async (userIds: string[], message: string) => {
    await NotificationService.notifySystemMaintenance(userIds, message)
  },

  // Notificações genéricas
  onSuccess: async (userId: string, title: string, message: string) => {
    await NotificationService.notifySuccess(userId, title, message)
  },

  onError: async (userId: string, title: string, message: string) => {
    await NotificationService.notifyError(userId, title, message)
  },

  onWarning: async (userId: string, title: string, message: string) => {
    await NotificationService.notifyWarning(userId, title, message)
  },

  onInfo: async (userId: string, title: string, message: string) => {
    await NotificationService.notifyInfo(userId, title, message)
  }
}

// 4. Como integrar em novos módulos
export const integrationExamples = {
  // Exemplo: Notificação quando um pedido é criado
  onOrderCreated: async (userId: string, orderId: string, orderNumber: string) => {
    await NotificationService.createNotification({
      title: "Pedido Criado",
      message: `Seu pedido #${orderNumber} foi criado com sucesso.`,
      type: "SUCCESS",
      userId,
      entityId: orderId,
      entityType: "order",
      actionUrl: `/orders/${orderId}`
    })
  },

  // Exemplo: Notificação quando um evento é criado
  onEventCreated: async (userId: string, eventId: string, eventTitle: string) => {
    await NotificationService.createNotification({
      title: "Novo Evento",
      message: `O evento "${eventTitle}" foi criado.`,
      type: "INFO",
      userId,
      entityId: eventId,
      entityType: "event",
      actionUrl: `/events/${eventId}`
    })
  },

  // Exemplo: Notificação em lote para todos os administradores
  notifyAllAdmins: async (title: string, message: string, adminUserIds: string[]) => {
    await NotificationService.createBulkNotification({
      title,
      message,
      type: "WARNING",
      userIds: adminUserIds,
      data: { adminAlert: true }
    })
  }
}

// 5. Como usar em componentes React
export const reactComponentExamples = {
  // Usar o hook de notificações
  useNotificationsExample: `
  import { useNotifications } from '@/hooks/use-notifications'

  function MyComponent() {
    const { unreadCount, markAsRead, markAllAsRead } = useNotifications()

    return (
      <div>
        <p>Você tem {unreadCount} notificações não lidas</p>
        <button onClick={markAllAsRead}>Marcar todas como lidas</button>
      </div>
    )
  }
  `,

  // Usar o dropdown de notificações
  notificationDropdownExample: `
  import { NotificationDropdown } from '@/components/notifications/notification-dropdown'

  function Header() {
    return (
      <header>
        <NotificationDropdown />
        <UserMenu />
      </header>
    )
  }
  `,

  // Usar a lista de notificações
  notificationListExample: `
  import { NotificationList } from '@/components/notifications/notification-list'

  function NotificationsPage() {
    return (
      <div>
        <h1>Notificações</h1>
        <NotificationList />
      </div>
    )
  }
  `
}

// 6. Boas práticas para implementação
export const bestPractices = {
  // 1. Sempre use try/catch ao criar notificações
  safeNotificationCreation: `
  try {
    await NotificationService.notifySuggestionCreated(suggestionId, authorId, number)
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    // Não falhar a operação principal
  }
  `,

  // 2. Use tipos específicos de notificação
  specificTypes: `
  // ✅ Bom: Use tipos específicos
  await NotificationService.notifySuggestionApproved(id, userId, number)

  // ❌ Ruim: Use tipos genéricos
  await NotificationService.createNotification({
    type: 'INFO',
    title: 'Ideia Aprovada',
    message: 'Sua Ideia foi aprovada',
    userId
  })
  `,

  // 3. Inclua sempre entityId e entityType para navegação
  includeEntityInfo: `
  await NotificationService.createNotification({
    title: 'Novo Pedido',
    message: 'Seu pedido foi criado',
    userId,
    entityId: orderId,        // ✅ Importante para navegação
    entityType: 'order',      // ✅ Importante para contexto
    actionUrl: '/orders/\${orderId}' // ✅ Opcional, mas recomendado
  })
  `,

  // 4. Use notificações em lote para eficiência
  bulkNotifications: `
  // ✅ Bom: Use bulk para múltiplos usuários
  await NotificationService.createBulkNotification({
    title: 'Manutenção do Sistema',
    message: 'O sistema ficará indisponível hoje às 22h',
    userIds: allUserIds,
    type: 'SYSTEM_MAINTENANCE'
  })
  `
}
