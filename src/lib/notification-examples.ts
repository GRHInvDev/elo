// Exemplos de uso do Sistema de Notificações
// Este arquivo serve como referência para implementar notificações em diferentes partes do sistema

import { api } from '@/trpc/server'
import type { RolesConfig } from '@/types/role-config'
import { db } from '@/server/db'

// Função auxiliar para verificar se o usuário pode receber notificações
async function canReceiveNotifications(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role_config: true }
    })
    const roleConfig = user?.role_config as RolesConfig
    
    console.log('Roles data:', JSON.stringify(roleConfig, null, 2));
    console.log('Roles type:', typeof roleConfig);
    
    // Se é sudo ou não é totem, pode receber notificações
    return !!roleConfig?.sudo || !roleConfig?.isTotem
  } catch {
    return false
  }
}

// 1. Notificações de Ideias
export const suggestionNotificationExamples = {
  // Quando uma Ideia é criada
  onSuggestionCreated: async (suggestionId: string, authorId: string, suggestionNumber: number) => {
    if (!(await canReceiveNotifications(authorId))) return
    
    await api.notification.create({
      title: "Nova Ideia Criada",
      message: `Sua Ideia #${suggestionNumber} foi criada com sucesso.`,
      type: "INFO",
      channel: "IN_APP",
      userId: authorId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/suggestions/${suggestionId}`
    })
  },

  // Quando uma Ideia é aprovada
  onSuggestionApproved: async (suggestionId: string, authorId: string, suggestionNumber: number) => {
    if (!(await canReceiveNotifications(authorId))) return
    
    await api.notification.create({
      title: "Ideia Aprovada",
      message: `Sua Ideia #${suggestionNumber} foi aprovada!`,
      type: "SUCCESS",
      channel: "IN_APP",
      userId: authorId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/suggestions/${suggestionId}`
    })
  },

  // Quando uma Ideia é rejeitada
  onSuggestionRejected: async (suggestionId: string, authorId: string, suggestionNumber: number, reason?: string) => {
    if (!(await canReceiveNotifications(authorId))) return
    
    await api.notification.create({
      title: "Ideia Rejeitada",
      message: `Sua Ideia #${suggestionNumber} foi rejeitada.${reason ? ` Motivo: ${reason}` : ''}`,
      type: "WARNING",
      channel: "IN_APP",
      userId: authorId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/suggestions/${suggestionId}`
    })
  },

  // Quando uma Ideia é atualizada
  onSuggestionUpdated: async (suggestionId: string, authorId: string, suggestionNumber: number) => {
    if (!(await canReceiveNotifications(authorId))) return
    
    await api.notification.create({
      title: "Ideia Atualizada",
      message: `Sua Ideia #${suggestionNumber} foi atualizada.`,
      type: "INFO",
      channel: "IN_APP",
      userId: authorId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/suggestions/${suggestionId}`
    })
  }
}

// 2. Notificações de KPIs
export const kpiNotificationExamples = {
  // Quando KPIs são adicionados a uma Ideia
  onKpiAdded: async (suggestionId: string, authorId: string, kpiName: string) => {
    if (!(await canReceiveNotifications(authorId))) return
    
    await api.notification.create({
      title: "KPI Adicionado",
      message: `O KPI "${kpiName}" foi adicionado à sua Ideia.`,
      type: "INFO",
      channel: "IN_APP",
      userId: authorId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/suggestions/${suggestionId}`
    })
  }
}

// 3. Notificações de Sistema
export const systemNotificationExamples = {
  // Notificações genéricas
  onSuccess: async (userId: string, title: string, message: string) => {
    if (!(await canReceiveNotifications(userId))) return
    
    await api.notification.create({
      title,
      message,
      type: "SUCCESS",
      channel: "IN_APP",
      userId,
      entityType: "system"
    })
  },

  onError: async (userId: string, title: string, message: string) => {
    if (!(await canReceiveNotifications(userId))) return
    
    await api.notification.create({
      title,
      message,
      type: "ERROR",
      channel: "IN_APP",
      userId,
      entityType: "system"
    })
  },

  onWarning: async (userId: string, title: string, message: string) => {
    if (!(await canReceiveNotifications(userId))) return
    
    await api.notification.create({
      title,
      message,
      type: "WARNING",
      channel: "IN_APP",
      userId,
      entityType: "system"
    })
  },

  onInfo: async (userId: string, title: string, message: string) => {
    if (!(await canReceiveNotifications(userId))) return
    
    await api.notification.create({
      title,
      message,
      type: "INFO",
      channel: "IN_APP",
      userId,
      entityType: "system"
    })
  }
}

// 4. Como integrar em novos módulos
export const integrationExamples = {
  // Exemplo: Notificação quando um pedido é criado
  onOrderCreated: async (userId: string, orderId: string, orderNumber: string) => {
    if (!(await canReceiveNotifications(userId))) return
    
    await api.notification.create({
      title: "Pedido Criado",
      message: `Seu pedido #${orderNumber} foi criado com sucesso.`,
      type: "SUCCESS",
      channel: "IN_APP",
      userId,
      entityId: orderId,
      entityType: "order",
      actionUrl: `/orders/${orderId}`
    })
  },

  // Exemplo: Notificação quando um evento é criado
  onEventCreated: async (userId: string, eventId: string, eventTitle: string) => {
    if (!(await canReceiveNotifications(userId))) return
    
    await api.notification.create({
      title: "Novo Evento",
      message: `O evento "${eventTitle}" foi criado.`,
      type: "INFO",
      channel: "IN_APP",
      userId,
      entityId: eventId,
      entityType: "event",
      actionUrl: `/events/${eventId}`
    })
  },
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
