"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, X } from "lucide-react"
import { useBrowserNotifications } from "@/hooks/use-browser-notifications"
import { cn } from "@/lib/utils"

/**
 * Componente para solicitar permissões de notificações do browser
 */
export function BrowserNotificationPermission() {
  const { isSupported, permission, requestPermission, canShowNotifications, testNotification } = useBrowserNotifications()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Verificar se deve mostrar o prompt
  useEffect(() => {
    if (!isSupported || dismissed) return

    // Mostrar prompt se ainda não foi concedida permissão
    if (permission === "default") {
      // Pequeno delay para não aparecer imediatamente
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 2000)

      return () => clearTimeout(timer)
    } else {
      setShowPrompt(false)
    }
  }, [isSupported, permission, dismissed])

  // Salvar estado de dismiss no localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = "browser-notification-dismissed"
      if (dismissed) {
        localStorage.setItem(key, "true")
      } else {
        localStorage.removeItem(key)
      }
    }
  }, [dismissed])

  // Carregar estado do localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = "browser-notification-dismissed"
      const wasDismissed = localStorage.getItem(key) === "true"
      setDismissed(wasDismissed)
    }
  }, [])

  const handleRequestPermission = async () => {
    try {
      const result = await requestPermission()

      if (result === "granted") {
        setShowPrompt(false)
      } else if (result === "denied") {
        setShowPrompt(false)
        setDismissed(true) // Se negado, não perguntar novamente
      }
      // Se for "default", manter o prompt visível para tentar novamente
    } catch (error) {
      console.error("Erro ao solicitar permissão de notificação:", error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
  }

  // Não renderizar se não suportado ou se já concedido ou se não deve mostrar
  if (!isSupported || !showPrompt || canShowNotifications) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className={cn(
        "shadow-lg border-2 transition-all duration-300",
        "animate-in slide-in-from-bottom-2 fade-in"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Notificações do Chat</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Receba notificações quando receber novas mensagens no chat,
            mesmo quando estiver em outras abas.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              onClick={handleRequestPermission}
              className="flex-1"
              size="sm"
            >
              <Bell className="h-4 w-4 mr-2" />
              Permitir
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              size="sm"
            >
              Agora não
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Você pode alterar esta configuração nas configurações do navegador.
          </p>
        </CardContent>
      </Card>
    </div>
  )

  // Se as notificações já estiverem permitidas, mostrar um botão de teste
  if (canShowNotifications) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="shadow-lg border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Notificações Ativadas</span>
            </div>
            <Button
              onClick={() => testNotification()}
              size="sm"
              variant="outline"
            >
              🧪 Testar Notificação
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
}

/**
 * Componente de status das notificações (para configurações)
 */
export function BrowserNotificationStatus() {
  const { isSupported, permission, requestPermission } = useBrowserNotifications()

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span className="text-sm">Notificações não suportadas neste navegador</span>
      </div>
    )
  }

  const getStatusInfo = () => {
    switch (permission) {
      case "granted":
        return {
          icon: Bell,
          text: "Notificações permitidas",
          color: "text-green-600",
          canRequest: false
        }
      case "denied":
        return {
          icon: BellOff,
          text: "Notificações bloqueadas",
          color: "text-red-600",
          canRequest: false
        }
      default:
        return {
          icon: Bell,
          text: "Clique para permitir notificações",
          color: "text-muted-foreground",
          canRequest: true
        }
    }
  }

  const { icon: Icon, text, color, canRequest } = getStatusInfo()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-sm">{text}</span>
      </div>
      {canRequest && (
        <Button
          variant="outline"
          size="sm"
          onClick={requestPermission}
        >
          Permitir
        </Button>
      )}
    </div>
  )
}
