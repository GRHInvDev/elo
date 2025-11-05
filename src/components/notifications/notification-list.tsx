"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Settings, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationItem } from "./notification-item"
import { useNotifications } from "@/hooks/use-notifications"
import { useUser } from "@clerk/nextjs"
import type { NotificationData } from "@/types/notification-types"

interface NotificationListProps {
  className?: string
  onNotificationClick?: (notification: unknown) => void
}

export function NotificationList({ className, onNotificationClick }: NotificationListProps) {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { user } = useUser()

  const notificationData = useNotifications({
    unreadOnly: showUnreadOnly,
    userId: user?.id
  })
  const {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    markAllAsRead,
    loadMore,
    isMarkingAllAsRead
  } = notificationData
  const notificationError = notificationData.error as Error | null

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`w-full max-w-md ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  if (notificationError) {
    return (
      <div className="p-4 text-center text-red-600">
        <p className="text-sm">Erro ao carregar notificações</p>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border dark:border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="font-semibold text-foreground dark:text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full border border-red-600 dark:border-red-500">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="h-8 px-2"
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`h-8 px-2 ${showUnreadOnly ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}`}
          >
            {showUnreadOnly ? 'Todas' : 'Não lidas'}
          </Button>
        </div>
      </div>

      {/* Lista de notificações */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {showUnreadOnly ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {notifications.map((notification: NotificationData) => {
              const id = notification.id
              const title = notification.title
              const message = notification.message
              const type = notification.type
              const isRead = notification.isRead
              const createdAt = typeof notification.createdAt === 'string' ? new Date(notification.createdAt) : notification.createdAt
              const actionUrl = notification.actionUrl

              return (
                <NotificationItem
                  key={id}
                  id={id}
                  title={title}
                  message={message}
                  type={type}
                  isRead={isRead}
                  createdAt={createdAt}
                  actionUrl={actionUrl}
                  onClick={() => onNotificationClick?.(notification)}
                />
              )
            })}

            {/* Botão de carregar mais */}
            {hasMore && (
              <div className="p-4 text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Carregando...
                    </>
                  ) : (
                    'Carregar mais'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border dark:border-border bg-muted/20 dark:bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-muted dark:hover:bg-muted"
          onClick={() => {
            router.push('/notifications')
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Gerenciar notificações
        </Button>
      </div>
    </div>
  )
}
