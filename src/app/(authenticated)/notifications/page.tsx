"use client"

import { useState } from "react"
import { Bell, Settings, Filter, Search, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotificationItem } from "@/components/notifications/notification-item"
import { NotificationPreferences } from "@/components/notifications/notification-preferences"
import { useNotifications } from "@/hooks/use-notifications"
import type { NotificationData } from "@/types/notification-types"

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [readFilter, setReadFilter] = useState<string>("all")

  const notificationData = useNotifications({
    limit: 50,
    autoRefresh: true,
    refreshInterval: 30000
  })

  const {
    notifications,
    unreadCount,
    total,
    hasMore,
    isLoading,
    markAllAsRead,
    loadMore,
    isMarkingAllAsRead
  } = notificationData

  // Filtrar notificações baseado nos critérios
  const filteredNotifications = notifications.filter((notification: NotificationData) => {
    const matchesSearch = searchTerm === "" ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || notification.type === typeFilter

    const matchesRead = readFilter === "all" ||
      (readFilter === "read" && notification.isRead) ||
      (readFilter === "unread" && !notification.isRead)

    return matchesSearch && matchesType && matchesRead
  })

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  const notificationTypes = [
    { value: "all", label: "Todos os tipos" },
    { value: "SUCCESS", label: "Sucesso" },
    { value: "ERROR", label: "Erro" },
    { value: "WARNING", label: "Aviso" },
    { value: "SUGGESTION_CREATED", label: "Sugestão criada" },
    { value: "SUGGESTION_UPDATED", label: "Sugestão atualizada" },
    { value: "SUGGESTION_APPROVED", label: "Sugestão aprovada" },
    { value: "SUGGESTION_REJECTED", label: "Sugestão rejeitada" },
    { value: "KPI_ADDED", label: "KPI adicionado" },
    { value: "CLASSIFICATION_UPDATED", label: "Classificação atualizada" },
    { value: "SYSTEM_MAINTENANCE", label: "Manutenção do sistema" },
  ]

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <Bell className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-foreground">
              Notificações
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Gerencie suas notificações e mantenha-se atualizado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isMarkingAllAsRead ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Marcando...
                </>
              ) : (
                <>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas ({unreadCount})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferências
          </TabsTrigger>
        </TabsList>

        {/* Tab de Notificações */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-red-500 rounded-full" />
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Não lidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{total - unreadCount}</p>
                <p className="text-sm text-muted-foreground">Lidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por tipo */}
            <div className="w-full lg:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por status de leitura */}
            <div className="w-full lg:w-32">
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="read">Lidas</SelectItem>
                  <SelectItem value="unread">Não lidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Notificações ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma notificação encontrada
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || typeFilter !== "all" || readFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Você está em dia com suas notificações!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification: NotificationData) => {
                const id = notification.id
                const title = notification.title
                const message = notification.message
                const type = notification.type
                const isRead = notification.isRead
                const createdAt = typeof notification.createdAt === 'string' ? new Date(notification.createdAt) : notification.createdAt
                const actionUrl = notification.actionUrl

                return (
                  <div key={id} className="p-4 hover:bg-muted/30 transition-colors">
                    <NotificationItem
                      id={id}
                      title={title}
                      message={message}
                      type={type}
                      isRead={isRead}
                      createdAt={createdAt}
                      actionUrl={actionUrl}
                      onClick={() => {
                        // Lidar com clique na notificação
                        console.log('Notificação clicada:', id)
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Botão de carregar mais */}
          {hasMore && !isLoading && (
            <div className="p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mr-2" />
                    Carregando...
                  </>
                ) : (
                  'Carregar mais notificações'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Tab de Preferências */}
        <TabsContent value="preferences" className="space-y-6 mt-6">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  )
}
