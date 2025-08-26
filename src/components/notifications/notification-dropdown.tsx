"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { NotificationList } from "./notification-list"
import { useNotificationCount, useNotifications } from "@/hooks/use-notifications"

interface NotificationDropdownProps {
  className?: string
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotificationCount()
  const { markAllAsRead } = useNotifications({ limit: 1 })

  // Marcar todas as notificações como lidas quando o dropdown é aberto
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead().catch(error => {
        console.error('Erro ao marcar notificações como lidas:', error)
      })
    }
  }, [isOpen, unreadCount, markAllAsRead])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative text-foreground hover:text-foreground dark:text-foreground dark:hover:text-foreground ${className}`}
        >
          <Bell className="h-5 w-5 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs font-bold border-2 border-background dark:border-background bg-red-500 text-white dark:bg-red-600"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0 shadow-lg border border-border dark:border-border bg-popover dark:bg-popover"
        align="end"
        sideOffset={8}
      >
        <NotificationList
          onNotificationClick={() => {
            setIsOpen(false) // Fechar dropdown ao clicar em uma notificação
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
