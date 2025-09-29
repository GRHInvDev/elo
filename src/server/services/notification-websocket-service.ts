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
   * TEMPORARIAMENTE DESATIVADO - Notificações WebSocket desabilitadas
   */
  async emitNewNotification(notification: Notification) {
    // TEMPORARIAMENTE DESATIVADO - Notificações WebSocket desabilitadas
    console.log('🔕 [NOTIFICATIONS DISABLED] WebSocket notification emission disabled:', notification.title)
    return
    
    /*
    // Import notificationUsers dynamically to avoid circular dependency
    const { notificationUsers }: { notificationUsers: Map<string, string> } = await import('../websocket/chat-server')

    // Encontrar socket do usuário destinatário
    const recipientSocketId = Array.from(notificationUsers.entries())
      .find(([_socketId, userId]) => userId === notification.userId)?.[0]

    if (recipientSocketId) {
      this.io.to(recipientSocketId).emit('notification', {
        type: 'new',
        notification: {
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          updatedAt: notification.updatedAt.toISOString()
        }
      })
    }
    */
  }

  /**
   * Atualiza a contagem de notificações não lidas para um usuário
   * TEMPORARIAMENTE DESATIVADO - Notificações WebSocket desabilitadas
   */
  async updateUnreadCount(userId: string) {
    // TEMPORARIAMENTE DESATIVADO - Notificações WebSocket desabilitadas
    console.log('🔕 [NOTIFICATIONS DISABLED] WebSocket unread count update disabled for user:', userId)
    return
    
    /*
    // Import notificationUsers and prisma dynamically
    const [{ notificationUsers }, { PrismaClient }] = await Promise.all([
      import('../websocket/chat-server'),
      import('@prisma/client')
    ])
    const prisma = new PrismaClient()

    // Encontrar socket do usuário
    const userSocketId = Array.from(notificationUsers.entries())
      .find(([_socketId, id]) => id === userId)?.[0]

    if (userSocketId) {
      void prisma.notification.count({
        where: { userId, isRead: false }
      }).then((unreadCount: number) => {
        this.io.to(userSocketId).emit('unreadCountUpdate', { count: unreadCount })
      }).catch((error: Error) => {
        console.error('Erro ao atualizar contagem de notificações:', error)
      })
    }
    */
  }

  /**
   * Emite notificação de atualização (ex: marcada como lida)
   * TEMPORARIAMENTE DESATIVADO - Notificações WebSocket desabilitadas
   */
  async emitNotificationUpdate(notification: Notification) {
    // TEMPORARIAMENTE DESATIVADO - Notificações WebSocket desabilitadas
    console.log('🔕 [NOTIFICATIONS DISABLED] WebSocket notification update disabled:', notification.title)
    return
    
    /*
    // Import notificationUsers dynamically to avoid circular dependency
    const { notificationUsers }: { notificationUsers: Map<string, string> } = await import('../websocket/chat-server')

    // Encontrar socket do usuário
    const recipientSocketId = Array.from(notificationUsers.entries())
      .find(([_socketId, userId]) => userId === notification.userId)?.[0]

    if (recipientSocketId) {
      this.io.to(recipientSocketId).emit('notification', {
        type: 'update',
        notification: {
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          updatedAt: notification.updatedAt.toISOString()
        }
      })
    }
    */
  }

  /**
   * Emite notificação de exclusão
   * TEMPORARIAMENTE DESATIVADO - Notificações WebSocket desabilitadas
   */
  async emitNotificationDelete(notification: Notification) {
    // TEMPORARIAMENTE DESATIVADO - Notificações WebSocket desabilitadas
    console.log('🔕 [NOTIFICATIONS DISABLED] WebSocket notification delete disabled:', notification.title)
    return
    
    /*
    // Import notificationUsers dynamically to avoid circular dependency
    const { notificationUsers }: { notificationUsers: Map<string, string> } = await import('../websocket/chat-server')

    // Encontrar socket do usuário
    const recipientSocketId = Array.from(notificationUsers.entries())
      .find(([_socketId, userId]) => userId === notification.userId)?.[0]

    if (recipientSocketId) {
      this.io.to(recipientSocketId).emit('notification', {
        type: 'delete',
        notification: {
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          updatedAt: notification.updatedAt.toISOString()
        }
      })
    }
    */
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
