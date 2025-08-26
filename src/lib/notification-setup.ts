import { NotificationService } from './notification-service'

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

  // Notificações de Sugestões
  async notifySuggestionCreated(suggestionId: string, authorId: string, suggestionNumber: number) {
    if (this.isEventEnabled('suggestions', 'onCreate')) {
      try {
        await NotificationService.notifySuggestionCreated(suggestionId, authorId, suggestionNumber)
        console.log('✅ Notificação de sugestão criada enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de sugestão criada:', error)
      }
    }
  }

  async notifySuggestionUpdated(suggestionId: string, authorId: string, suggestionNumber: number) {
    if (this.isEventEnabled('suggestions', 'onUpdate')) {
      try {
        await NotificationService.notifySuggestionUpdated(suggestionId, authorId, suggestionNumber)
        console.log('✅ Notificação de sugestão atualizada enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de sugestão atualizada:', error)
      }
    }
  }

  async notifySuggestionApproved(suggestionId: string, authorId: string, suggestionNumber: number) {
    if (this.isEventEnabled('suggestions', 'onStatusChange')) {
      try {
        await NotificationService.notifySuggestionApproved(suggestionId, authorId, suggestionNumber)
        console.log('✅ Notificação de sugestão aprovada enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de sugestão aprovada:', error)
      }
    }
  }

  async notifySuggestionRejected(suggestionId: string, authorId: string, suggestionNumber: number, reason?: string) {
    if (this.isEventEnabled('suggestions', 'onStatusChange')) {
      try {
        await NotificationService.notifySuggestionRejected(suggestionId, authorId, suggestionNumber, reason)
        console.log('✅ Notificação de sugestão rejeitada enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de sugestão rejeitada:', error)
      }
    }
  }

  async notifyClassificationUpdated(suggestionId: string, authorId: string, suggestionNumber: number) {
    if (this.isEventEnabled('suggestions', 'onClassificationUpdate')) {
      try {
        await NotificationService.notifyClassificationUpdated(suggestionId, authorId, suggestionNumber)
        console.log('✅ Notificação de classificação atualizada enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de classificação atualizada:', error)
      }
    }
  }

  async notifyKpiAdded(suggestionId: string, authorId: string, kpiName: string) {
    if (this.isEventEnabled('suggestions', 'onKpiAdded')) {
      try {
        await NotificationService.notifyKpiAdded(suggestionId, authorId, kpiName)
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
        await NotificationService.notifySuccess(
          authorId,
          'KPI Criado',
          `O KPI "${kpiName}" foi criado com sucesso.`
        )
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
        await NotificationService.notifySystemMaintenance(userIds, message)
        console.log('✅ Notificação de manutenção enviada para', userIds.length, 'usuários')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de manutenção:', error)
      }
    }
  }

  async notifySystemError(userId: string, title: string, message: string) {
    if (this.isEventEnabled('system', 'onError')) {
      try {
        await NotificationService.notifyError(userId, title, message)
        console.log('✅ Notificação de erro enviada')
      } catch (error) {
        console.error('❌ Erro ao enviar notificação de erro:', error)
      }
    }
  }

  async notifySystemWarning(userId: string, title: string, message: string) {
    if (this.isEventEnabled('system', 'onWarning')) {
      try {
        await NotificationService.notifyWarning(userId, title, message)
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
