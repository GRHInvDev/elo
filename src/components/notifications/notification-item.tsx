"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Check, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/use-notifications"

interface NotificationItemProps {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  actionUrl?: string
  entityId?: string
  entityType?: string
  onClick?: () => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "SUCCESS":
      return "✅"
    case "ERROR":
      return "❌"
    case "WARNING":
      return "⚠️"
    case "SUGGESTION_CREATED":
    case "SUGGESTION_UPDATED":
      return "💡"
    case "SUGGESTION_APPROVED":
      return "🎉"
    case "SUGGESTION_REJECTED":
      return "📝"
    case "KPI_ADDED":
      return "📊"
    case "CLASSIFICATION_UPDATED":
      return "📈"
    case "SYSTEM_MAINTENANCE":
      return "🔧"
    default:
      return "📢"
  }
}

const getNotificationColor = (type: string, isRead: boolean) => {
  if (isRead) {
    return "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
  }

  switch (type) {
    case "SUCCESS":
      return "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
    case "ERROR":
      return "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
    case "WARNING":
      return "border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20"
    case "SUGGESTION_CREATED":
    case "SUGGESTION_UPDATED":
      return "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
    case "SUGGESTION_APPROVED":
      return "border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
    case "SUGGESTION_REJECTED":
      return "border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20"
    case "KPI_ADDED":
      return "border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20"
    case "CLASSIFICATION_UPDATED":
      return "border-indigo-200 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20"
    case "SYSTEM_MAINTENANCE":
      return "border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
    default:
      return "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50"
  }
}

export function NotificationItem({
  id,
  title,
  message,
  type,
  isRead,
  createdAt,
  actionUrl,
  onClick
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const { markAsRead, deleteNotification, isMarkingAsRead, isDeleting } = useNotifications()

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isRead) {
      try {
        await markAsRead(id)
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error)
      }
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteNotification(id)
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }

  const handleClick = async () => {
    if (!isRead) {
      // Create a proper mock event object with non-empty methods
      const mockEvent = {
        stopPropagation: () => { return undefined },
        preventDefault: () => { return undefined },
        currentTarget: null,
        target: null
      } as unknown as React.MouseEvent
      await handleMarkAsRead(mockEvent)
    }

    // Verificar se a notificação está relacionada a Ideias
    const isSuggestionNotification = type && [
      'SUGGESTION_CREATED',
      'SUGGESTION_UPDATED',
      'SUGGESTION_APPROVED',
      'SUGGESTION_REJECTED'
    ].includes(type)

    if (isSuggestionNotification) {
      // Redirecionar para a página de minhas Ideias
      router.push('/my-suggestions')
      return
    }

    onClick?.()
    if (actionUrl) {
      window.location.href = actionUrl
    }
  }

  return (
    <Card
      className={cn(
        "group transition-all duration-200 cursor-pointer hover:shadow-md dark:shadow-lg",
        getNotificationColor(String(type), isRead),
        isHovered && "shadow-md dark:shadow-lg"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Ícone da notificação */}
          <div className="flex-shrink-0 mt-1">
            <span className="text-lg">{getNotificationIcon(String(type))}</span>
          </div>

          {/* Conteúdo da notificação */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={cn(
                  "font-medium text-sm leading-5 mb-1 text-foreground dark:text-foreground",
                  !isRead && "font-semibold"
                )}>
                  {title}
                </h4>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-4 mb-2 line-clamp-2">
                  {message}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(createdAt), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                  {!isRead && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-secondary dark:bg-secondary text-secondary-foreground dark:text-secondary-foreground border-secondary dark:border-secondary">
                      Nova
                    </Badge>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-1 ml-2">
                {!isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent dark:hover:bg-accent"
                    onClick={handleMarkAsRead}
                    disabled={isMarkingAsRead}
                  >
                    <Check className="h-3 w-3 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground" />
                  </Button>
                )}

                {actionUrl && !actionUrl.includes('/admin/') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent dark:hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = actionUrl
                    }}
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 dark:hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <X className="h-3 w-3 text-muted-foreground dark:text-muted-foreground hover:text-destructive dark:hover:text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
