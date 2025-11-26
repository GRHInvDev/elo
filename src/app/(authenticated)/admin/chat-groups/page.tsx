"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAccessControl } from "@/hooks/use-access-control"
import { MessageSquare, Users, Plus, Settings } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { ChatGroupsList } from "./_components/chat-groups-list"
import { CreateGroupDialog } from "./_components/create-group-dialog"

export default function ChatGroupsAdminPage() {
  const { hasAdminAccess, isLoading, isSudo } = useAccessControl()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Verificar acesso à página
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando permissões...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const hasChatGroupsManagementAccess = isSudo || hasAdminAccess("/admin/chat-groups")

  if (!hasChatGroupsManagementAccess) {
    return (
      <DashboardShell>
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar o gerenciamento de grupos de chat.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Grupos de Chat</h1>
            <p className="text-muted-foreground">
              Gerencie grupos de chat e controle quem pode participar de cada conversa.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Grupo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grupos Ativos</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Grupos criados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Usuários em grupos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Conversas ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="text-xs">
                Sistema Ativo
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Grupos */}
        <Card>
          <CardHeader>
            <CardTitle>Grupos de Chat</CardTitle>
            <CardDescription>
              Gerencie todos os grupos de chat da plataforma. Cada grupo permite conversas privadas entre membros selecionados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChatGroupsList />
          </CardContent>
        </Card>

        {/* Dialog para criar grupo */}
        <CreateGroupDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </DashboardShell>
  )
}