import type { Server } from 'socket.io'
import type { Notification } from '@prisma/client'

/**
 * Serviço para emitir notificações via WebSocket
 * Usado pelas rotas tRPC para enviar notificações em tempo real
 */
export class NotificationWebSocketService {
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  /**
   * Emite uma nova notificação via WebSocket
   */
  async emitNewNotification(notification: Notification) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    if (!baseUrl) return
    try {
      await fetch(`${baseUrl}/api/socket/emit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: notification.userId,
          type: 'notification:new',
          payload: {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            updatedAt: notification.updatedAt.toISOString(),
          }
        })
      })
    } catch (error) {
      console.error('Erro ao emitir nova notificação via WS:', error)
    }
  }

  /**
   * Atualiza a contagem de notificações não lidas para um usuário
   */
  async updateUnreadCount(userId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    if (!baseUrl) return
    try {
      await fetch(`${baseUrl}/api/socket/emit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, type: 'unreadCount' })
      })
    } catch (error) {
      console.error('Erro ao emitir atualização de contagem via WS:', error)
    }
  }

  /**
   * Emite notificação de atualização (ex: marcada como lida)
   */
  async emitNotificationUpdate(notification: Notification) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    if (!baseUrl) return
    try {
      await fetch(`${baseUrl}/api/socket/emit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: notification.userId,
          type: 'notification:update',
          payload: {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            updatedAt: notification.updatedAt.toISOString(),
          }
        })
      })
    } catch (error) {
      console.error('Erro ao emitir atualização de notificação via WS:', error)
    }
  }

  /**
   * Emite notificação de exclusão
   */
  async emitNotificationDelete(notification: Notification) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    if (!baseUrl) return
    try {
      await fetch(`${baseUrl}/api/socket/emit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: notification.userId,
          type: 'notification:delete',
          payload: {
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            updatedAt: notification.updatedAt.toISOString(),
          }
        })
      })
    } catch (error) {
      console.error('Erro ao emitir exclusão de notificação via WS:', error)
    }
  }
}

// Instância global (será inicializada quando o servidor WebSocket for criado)
let notificationWebSocketService: NotificationWebSocketService | null = null

/**
 * Inicializa o serviço de notificações WebSocket
 */
export function initializeNotificationWebSocketService(io: Server) {
  notificationWebSocketService = new NotificationWebSocketService(io)
  console.log('🔔 Serviço de notificações WebSocket inicializado')
}

/**
 * Obtém a instância do serviço de notificações WebSocket
 */
export function getNotificationWebSocketService(): NotificationWebSocketService | null {
  return notificationWebSocketService
}
