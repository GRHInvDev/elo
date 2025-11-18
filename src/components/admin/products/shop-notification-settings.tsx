"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, AlertCircle, CheckCircle2 } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"

export function ShopNotificationSettings() {
  const [email, setEmail] = useState("")

  const { data: config, isLoading, refetch } = api.globalConfig.get.useQuery()
  const updateEmail = api.globalConfig.updateShopNotificationEmail.useMutation({
    onSuccess: () => {
      toast.success("Email de notificação atualizado com sucesso!")
      void refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar email: ${error.message}`)
    },
  })

  // Preencher campo quando config carregar
  useEffect(() => {
    if (config?.shopNotificationEmail) {
      setEmail(config.shopNotificationEmail)
    }
  }, [config?.shopNotificationEmail])

  const handleSave = () => {
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Por favor, insira um email válido")
      return
    }

    updateEmail.mutate({
      email: email || null
    })
  }

  const handleClear = () => {
    if (confirm("Tem certeza que deseja remover o email de notificação?")) {
      updateEmail.mutate({
        email: null
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Configurações de Notificação
        </CardTitle>
        <CardDescription>
          Configure o email que receberá notificações de novos pedidos de produtos.
          Se não configurado, apenas os responsáveis por empresa receberão notificações.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notification-email">Email de Notificação</Label>
          <div className="flex gap-2">
            <Input
              id="notification-email"
              type="email"
              placeholder="exemplo@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={updateEmail.isPending}
            />
            <Button
              onClick={handleSave}
              disabled={updateEmail.isPending || email === config?.shopNotificationEmail}
            >
              {updateEmail.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
            {config?.shopNotificationEmail && (
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={updateEmail.isPending}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        {config?.shopNotificationEmail ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Email configurado: <strong>{config.shopNotificationEmail}</strong>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum email global configurado. Apenas os responsáveis por empresa receberão notificações.
            </AlertDescription>
          </Alert>
        )}

        <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-1">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Este email receberá notificações de <strong>todos</strong> os pedidos</li>
            <li>Os responsáveis por empresa também receberão notificações dos pedidos de suas respectivas empresas</li>
            <li>O usuário que fez o pedido sempre receberá um email de confirmação</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

