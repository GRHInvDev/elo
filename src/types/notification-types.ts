// Tipos temporários para notificações enquanto tRPC se configura
export interface NotificationData {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date | string
  actionUrl?: string
  entityId?: string
  entityType?: string
}

export interface NotificationPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  suggestionUpdates: boolean
  systemNotifications: boolean
  postNotifications: boolean
  bookingNotifications: boolean
  foodOrderNotifications: boolean
  birthdayNotifications: boolean
  soundEnabled: boolean
  popupEnabled: boolean
  successNotifications: boolean
  errorNotifications: boolean
  warningNotifications: boolean
  suggestionNotifications: boolean
  kpiNotifications: boolean
  maintenanceNotifications: boolean
}

export interface UseNotificationsReturn {
  notifications: NotificationData[]
  total: number
  unreadCount: number
  hasMore: boolean
  isLoading: boolean
  error: unknown
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  loadMore: () => void
  resetOffset: () => void
  refetch: () => Promise<unknown>
  isMarkingAsRead: boolean
  isMarkingAllAsRead: boolean
  isDeleting: boolean
}
