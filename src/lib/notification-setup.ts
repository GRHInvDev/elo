import { api } from '@/trpc/server'
import type { RolesConfig } from '@/types/role-config'
import { db } from '@/server/db'

// Flag para habilitar/desabilitar notificações globalmente
export const NOTIFICATIONS_ENABLED = process.env.NEXT_PUBLIC_NOTIFICATIONS_ENABLED === 'true'

// Configuração de notificações por módulo
export const NOTIFICATION_CONFIG = {
  suggestions: {
    enabled: NOTIFICATIONS_ENABLED,
    events: {
      onCreate: true,
      onUpdate: true,
      onStatusChange: true,
      onClassificationUpdate: true,
      onKpiAdded: true
    }
  },
  kpis: {
    enabled: NOTIFICATIONS_ENABLED,
    events: {
      onCreate: true,
      onUpdate: true,
      onDelete: true,
      onLinkToSuggestion: true
    }
  },
  system: {
    enabled: NOTIFICATIONS_ENABLED,
    events: {
      onMaintenance: true,
      onError: true,
      onWarning: true
    }
  }
} as const

// Função auxiliar para verificar se o usuário pode receber notificações
async function canReceiveNotifications(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role_config: true }
    })
    const roleConfig = user?.role_config as RolesConfig | null
    
    console.log('Roles data:', JSON.stringify(roleConfig, null, 2));
    console.log('Roles type:', typeof roleConfig);
    
    // Se é sudo ou não é totem, pode receber notificações
    return !!roleConfig?.sudo || !roleConfig?.isTotem
  } catch {
    return false
  }
}

// Função auxiliar para filtrar usuários que podem receber notificações
async function filterUsersForNotifications(userIds: string[]): Promise<string[]> {
  const validUsers: string[] = []
  
  for (const userId of userIds) {
    if (await canReceiveNotifications(userId)) {
      validUsers.push(userId)
    }
  }
  
  return validUsers
}

// Classe para gerenciar notificações de forma centralizada
export class NotificationManager {
  private static instance: NotificationManager
  private config = NOTIFICATION_CONFIG

  private constructor() {
    // Construtor vazio necessário para singleton
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  // Verificar se notificações estão habilitadas para um módulo
  isEnabled(module: keyof typeof NOTIFICATION_CONFIG): boolean {
    return this.config[module].enabled
  }

  // Verificar se um evento específico está habilitado
  isEventEnabled(module: keyof typeof NOTIFICATION_CONFIG, event: string): boolean {
    const moduleConfig = this.config[module]
    const events = moduleConfig.events as Record<string, boolean>
    return moduleConfig.enabled && events[event] === true
  }

  // Notificações de ideias
  async notifySuggestionCreated(suggestionId: string, authorId: string, suggestionNumber: number) {
    if (this.isEventEnabled('suggestions', 'onCreate')) {
      try {
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
        console.log('✅ Notificação de ideia criada enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de ideia criada:', error)
      }
    }
  }

  async notifySuggestionUpdated(suggestionId: string, authorId: string, suggestionNumber: number) {
    if (this.isEventEnabled('suggestions', 'onUpdate')) {
      try {
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
        console.log('✅ Notificação de ideia atualizada enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de ideia atualizada:', error)
      }
    }
  }

  async notifySuggestionApproved(suggestionId: string, authorId: string, suggestionNumber: number) {
    if (this.isEventEnabled('suggestions', 'onStatusChange')) {
      try {
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
        console.log('✅ Notificação de ideia aprovada enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de ideia aprovada:', error)
      }
    }
  }

  async notifySuggestionRejected(suggestionId: string, authorId: string, suggestionNumber: number, reason?: string) {
    if (this.isEventEnabled('suggestions', 'onStatusChange')) {
      try {
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
        console.log('✅ Notificação de ideia rejeitada enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de ideia rejeitada:', error)
      }
    }
  }

  async notifyClassificationUpdated(suggestionId: string, authorId: string, suggestionNumber: number) {
    if (this.isEventEnabled('suggestions', 'onClassificationUpdate')) {
      try {
        if (!(await canReceiveNotifications(authorId))) return
        
        await api.notification.create({
          title: "Classificação Atualizada",
          message: `A classificação da sua Ideia #${suggestionNumber} foi atualizada.`,
          type: "INFO",
          channel: "IN_APP",
          userId: authorId,
          entityId: suggestionId,
          entityType: "suggestion",
          actionUrl: `/suggestions/${suggestionId}`
        })
        console.log('✅ Notificação de classificação atualizada enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de classificação atualizada:', error)
      }
    }
  }

  async notifyKpiAdded(suggestionId: string, authorId: string, kpiName: string) {
    if (this.isEventEnabled('suggestions', 'onKpiAdded')) {
      try {
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
        console.log('✅ Notificação de KPI adicionado enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de KPI adicionado:', error)
      }
    }
  }

  // Notificações de KPIs
  async notifyKpiCreated(kpiId: string, authorId: string, kpiName: string) {
    if (this.isEventEnabled('kpis', 'onCreate')) {
      try {
        if (!(await canReceiveNotifications(authorId))) return
        
        await api.notification.create({
          title: "KPI Criado",
          message: `O KPI "${kpiName}" foi criado com sucesso.`,
          type: "SUCCESS",
          channel: "IN_APP",
          userId: authorId,
          entityId: kpiId,
          entityType: "kpi"
        })
        console.log('✅ Notificação de KPI criado enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de KPI criado:', error)
      }
    }
  }

  // Notificações do Sistema
  async notifySystemMaintenance(userIds: string[], message: string) {
    if (this.isEventEnabled('system', 'onMaintenance')) {
      try {
        const validUsers = await filterUsersForNotifications(userIds)
        if (validUsers.length === 0) return
        
        const notifications = validUsers.map(userId => ({
          title: 'Manutenção do Sistema',
          message,
          type: 'SYSTEM_MAINTENANCE' as const,
          channel: 'IN_APP' as const,
          userId,
          entityType: 'system' as const
        }))
        
        await api.notification.createBulk({ 
          title: 'Manutenção do Sistema',
          message,
          userIds: validUsers,
          notifications 
        })
        console.log('✅ Notificação de manutenção enviada para', validUsers.length, 'usuários')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de manutenção:', error)
      }
    }
  }

  async notifySystemError(userId: string, title: string, message: string) {
    if (this.isEventEnabled('system', 'onError')) {
      try {
        if (!(await canReceiveNotifications(userId))) return
        
        await api.notification.create({
          title,
          message,
          type: "ERROR",
          channel: "IN_APP",
          userId,
          entityType: "system"
        })
        console.log('✅ Notificação de erro enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de erro:', error)
      }
    }
  }

  async notifySystemWarning(userId: string, title: string, message: string) {
    if (this.isEventEnabled('system', 'onWarning')) {
      try {
        if (!(await canReceiveNotifications(userId))) return
        
        await api.notification.create({
          title,
          message,
          type: "WARNING",
          channel: "IN_APP",
          userId,
          entityType: "system"
        })
        console.log('✅ Notificação de aviso enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de aviso:', error)
      }
    }
  }

  // Método para atualizar configuração em runtime
  updateConfig(newConfig: Partial<typeof NOTIFICATION_CONFIG>) {
    this.config = { ...this.config, ...newConfig }
  }
}

// Instância global do gerenciador
export const notificationManager = NotificationManager.getInstance()

// Hook para usar notificações em componentes
export const useNotificationManager = () => {
  return notificationManager
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  (window as Window & { notificationManager?: NotificationManager }).notificationManager = notificationManager
}