"use client"

import { useState } from "react"
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
    return "border-gray-200 bg-gray-50"
  }

  switch (type) {
    case "SUCCESS":
      return "border-green-200 bg-green-50"
    case "ERROR":
      return "border-red-200 bg-red-50"
    case "WARNING":
      return "border-yellow-200 bg-yellow-50"
    case "SUGGESTION_CREATED":
    case "SUGGESTION_UPDATED":
      return "border-blue-200 bg-blue-50"
    case "SUGGESTION_APPROVED":
      return "border-emerald-200 bg-emerald-50"
    case "SUGGESTION_REJECTED":
      return "border-orange-200 bg-orange-50"
    case "KPI_ADDED":
      return "border-purple-200 bg-purple-50"
    case "CLASSIFICATION_UPDATED":
      return "border-indigo-200 bg-indigo-50"
    case "SYSTEM_MAINTENANCE":
      return "border-amber-200 bg-amber-50"
    default:
      return "border-gray-200 bg-white"
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
    onClick?.()
    if (actionUrl) {
      window.location.href = actionUrl
    }
  }

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer hover:shadow-md",
        getNotificationColor(String(type), isRead),
        isHovered && "shadow-md"
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
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-secondary dark:bg-secondary text-secondary-foreground dark:text-secondary-foreground">
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
                    <Check className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                  </Button>
                )}

                {actionUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent dark:hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = actionUrl
                    }}
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 dark:hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <X className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
