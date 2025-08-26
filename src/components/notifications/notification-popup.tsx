"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface NotificationPopupProps {
  id: string
  title: string
  message: string
  type?: string
  duration?: number
  onClose?: () => void
  onAction?: () => void
  actionUrl?: string
}

export function NotificationPopup({
  id: _id,
  title,
  message,
  type = "info",
  duration = 5000,
  onClose,
  onAction,
  actionUrl
}: NotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300) // Tempo da animação de saída
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, handleClose])

  const handleAction = () => {
    if (actionUrl) {
      window.location.href = actionUrl
    }
    onAction?.()
    handleClose()
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
      case "error":
        return "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20"
      default:
        return "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅"
      case "error":
        return "❌"
      case "warning":
        return "⚠️"
      default:
        return "📢"
    }
  }

  if (!isVisible) return null

  return (
    <Card
      className={cn(
        "fixed top-4 right-4 z-50 w-80 shadow-lg border transition-all duration-300",
        getTypeStyles(type),
        isExiting && "opacity-0 transform translate-x-full"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <span className="text-lg">{getIcon(type)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground dark:text-foreground mb-1">
              {title}
            </h4>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-4">
              {message}
            </p>

            {actionUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-6 px-2 text-xs hover:bg-accent dark:hover:bg-accent text-foreground dark:text-foreground"
                onClick={handleAction}
              >
                <Check className="h-3 w-3 mr-1" />
                Ver
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-6 w-6 p-0 hover:bg-accent dark:hover:bg-accent text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
            onClick={handleClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Gerenciador de popups de notificação
export function NotificationPopupManager() {
  const [popups, setPopups] = useState<NotificationPopupProps[]>([])

  const removePopup = useCallback((id: string) => {
    setPopups(prev => prev.filter(popup => popup.id !== id))
  }, [])

  const showPopup = useCallback((popup: Omit<NotificationPopupProps, 'id'>) => {
    const id = `popup-${Date.now()}-${Math.random()}`
    const newPopup: NotificationPopupProps = { id, ...popup }

    setPopups(prev => [...prev, newPopup])

    // Auto-remover após a duração
    setTimeout(() => {
      removePopup(id)
    }, popup.duration ?? 5000)
  }, [removePopup])

  // Função global para mostrar popups
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowWithPopup = window as Window & {
        showNotificationPopup?: (popup: Omit<NotificationPopupProps, 'id'>) => void
      }
      windowWithPopup.showNotificationPopup = showPopup
    }

    return () => {
      if (typeof window !== 'undefined') {
        const windowWithPopup = window as Window & {
          showNotificationPopup?: (popup: Omit<NotificationPopupProps, 'id'>) => void
        }
        delete windowWithPopup.showNotificationPopup
      }
    }
  }, [showPopup])

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      {popups.map((popup, index) => (
        <div
          key={popup.id}
          className="pointer-events-auto"
          style={{
            top: `${16 + (index * 100)}px`,
            right: '16px'
          }}
        >
          <NotificationPopup
            {...popup}
            onClose={() => removePopup(popup.id)}
          />
        </div>
      ))}
    </div>
  )
}

// Hook para usar popups
export const useNotificationPopup = () => {
  const showPopup = (popup: Omit<NotificationPopupProps, 'id'>) => {
    if (typeof window !== 'undefined') {
      const showNotificationPopup = (window as Window & {
        showNotificationPopup?: (popup: Omit<NotificationPopupProps, 'id'>) => void
      }).showNotificationPopup

      if (showNotificationPopup) {
        showNotificationPopup(popup)
      }
    }
  }

  return { showPopup }
}
