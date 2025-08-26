import { NotificationType, NotificationChannel } from "@prisma/client"
import { api } from "@/trpc/react"

// Tipos para facilitar o uso do serviço
interface CreateNotificationParams {
  title: string
  message: string
  type?: NotificationType
  channel?: NotificationChannel
  userId: string
  entityId?: string
  entityType?: string
  actionUrl?: string
  data?: any
}

interface CreateBulkNotificationParams {
  title: string
  message: string
  type?: NotificationType
  channel?: NotificationChannel
  userIds: string[]
  entityId?: string
  entityType?: string
  actionUrl?: string
  data?: any
}

// Classe de serviço para notificações
export class NotificationService {
  // Criar uma notificação individual
  static async createNotification(params: CreateNotificationParams) {
    try {
      return await api.notification.create.mutate(params)
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      throw error
    }
  }

  // Criar notificações em lote
  static async createBulkNotification(params: CreateBulkNotificationParams) {
    try {
      return await api.notification.createBulk.mutate(params)
    } catch (error) {
      console.error('Erro ao criar notificações em lote:', error)
      throw error
    }
  }

  // Notificações específicas para sugestões
  static async notifySuggestionCreated(suggestionId: string, authorId: string, suggestionNumber: number) {
    return this.createNotification({
      title: "Nova Sugestão Criada",
      message: `Sua sugestão #${suggestionNumber} foi criada com sucesso e está em análise.`,
      type: NotificationType.SUGGESTION_CREATED,
      userId: authorId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/admin/suggestions?suggestion=${suggestionId}`
    })
  }

  static async notifySuggestionUpdated(suggestionId: string, userId: string, suggestionNumber: number) {
    return this.createNotification({
      title: "Sugestão Atualizada",
      message: `A sugestão #${suggestionNumber} foi atualizada.`,
      type: NotificationType.SUGGESTION_UPDATED,
      userId: userId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/admin/suggestions?suggestion=${suggestionId}`
    })
  }

  static async notifySuggestionApproved(suggestionId: string, userId: string, suggestionNumber: number) {
    return this.createNotification({
      title: "Sugestão Aprovada! 🎉",
      message: `Parabéns! Sua sugestão #${suggestionNumber} foi aprovada.`,
      type: NotificationType.SUGGESTION_APPROVED,
      userId: userId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/admin/suggestions?suggestion=${suggestionId}`
    })
  }

  static async notifySuggestionRejected(suggestionId: string, userId: string, suggestionNumber: number, reason?: string) {
    return this.createNotification({
      title: "Sugestão Rejeitada",
      message: `Sua sugestão #${suggestionNumber} foi rejeitada.${reason ? ` Motivo: ${reason}` : ''}`,
      type: NotificationType.SUGGESTION_REJECTED,
      userId: userId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/admin/suggestions?suggestion=${suggestionId}`
    })
  }

  // Notificações para KPIs
  static async notifyKpiAdded(suggestionId: string, userId: string, kpiName: string) {
    return this.createNotification({
      title: "KPI Adicionado",
      message: `O KPI "${kpiName}" foi adicionado à sua sugestão.`,
      type: NotificationType.KPI_ADDED,
      userId: userId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/admin/suggestions?suggestion=${suggestionId}`
    })
  }

  // Notificações para classificações
  static async notifyClassificationUpdated(suggestionId: string, userId: string, suggestionNumber: number) {
    return this.createNotification({
      title: "Classificação Atualizada",
      message: `A classificação da sugestão #${suggestionNumber} foi atualizada.`,
      type: NotificationType.CLASSIFICATION_UPDATED,
      userId: userId,
      entityId: suggestionId,
      entityType: "suggestion",
      actionUrl: `/admin/suggestions?suggestion=${suggestionId}`
    })
  }

  // Notificações do sistema
  static async notifySystemMaintenance(userIds: string[], message: string) {
    return this.createBulkNotification({
      title: "Manutenção do Sistema",
      message,
      type: NotificationType.SYSTEM_MAINTENANCE,
      userIds,
      data: { maintenance: true }
    })
  }

  // Notificações de erro/sucesso genéricas
  static async notifyError(userId: string, title: string, message: string, entityId?: string, entityType?: string) {
    return this.createNotification({
      title,
      message,
      type: NotificationType.ERROR,
      userId,
      entityId,
      entityType
    })
  }

  static async notifySuccess(userId: string, title: string, message: string, entityId?: string, entityType?: string) {
    return this.createNotification({
      title,
      message,
      type: NotificationType.SUCCESS,
      userId,
      entityId,
      entityType
    })
  }

  static async notifyInfo(userId: string, title: string, message: string, entityId?: string, entityType?: string) {
    return this.createNotification({
      title,
      message,
      type: NotificationType.INFO,
      userId,
      entityId,
      entityType
    })
  }

  static async notifyWarning(userId: string, title: string, message: string, entityId?: string, entityType?: string) {
    return this.createNotification({
      title,
      message,
      type: NotificationType.WARNING,
      userId,
      entityId,
      entityType
    })
  }
}

// Hook personalizado para usar notificações
export const useNotifications = () => {
  const utils = api.useUtils()

  const markAsRead = async (id: string) => {
    try {
      await api.notification.markAsRead.mutate({ id })
      utils.notification.list.invalidate()
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.notification.markAllAsRead.mutate()
      utils.notification.list.invalidate()
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await api.notification.delete.mutate({ id })
      utils.notification.list.invalidate()
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    invalidate: () => utils.notification.list.invalidate()
  }
}
