"use client"

import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAccessControl } from "@/hooks/use-access-control"
import { api } from "@/trpc/react"
import {
  MessageSquare,
  Users,
  UserCheck,
  Settings,
  BarChart3,
  AlertTriangle,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ChatManagementPage() {
  const { hasAdminAccess, isLoading, isSudo } = useAccessControl()

  const hasChatManagementAccess = isSudo || hasAdminAccess("/admin/chat")

  // Buscar estatísticas do chat (sempre chamado para manter ordem dos hooks)
  const { data: chatStats } = api.chatMessage.getGlobalStats.useQuery(undefined, {
    enabled: hasChatManagementAccess && !isLoading
  })

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

  if (!hasChatManagementAccess) {
    return (
      <DashboardShell>
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar o gerenciamento de chat.
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
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Chat</h1>
            <p className="text-muted-foreground">
              Monitore e controle todo o sistema de chat da plataforma.
            </p>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Totais</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {chatStats?.totalMessages?.toLocaleString() ?? '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Desde o início
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {chatStats?.activeUsersCount ?? '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Com mensagens enviadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grupos Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {chatStats?.activeGroupsCount ?? '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Grupos criados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="text-xs">
                Sistema Ativo
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Gerenciamento */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Grupos de Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciar Grupos Chat
              </CardTitle>
              <CardDescription>
                Gerencie grupos de chat, adicione/remova membros e controle permissões.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {chatStats?.activeGroupsCount ?? 0} grupos ativos
                </span>
                <Link href="/admin/chat-groups">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gerenciar Grupos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Análise e Relatórios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise e Relatórios
              </CardTitle>
              <CardDescription>
                Visualize estatísticas detalhadas, atividade de usuários e métricas de uso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Em breve: Relatórios detalhados de uso do chat
              </div>
              <Button variant="outline" size="sm" disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>


        </div>

        {/* Últimas Atividades */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Atividades</CardTitle>
            <CardDescription>
              Acompanhe as atividades recentes no sistema de chat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chatStats?.lastMessage ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      Última mensagem em {chatStats.lastMessage.roomId === 'global' ? 'Chat Global' : 'Grupo'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {chatStats.lastMessage.content ?? 'Mensagem sem texto'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(chatStats.lastMessage.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-sm font-medium mb-2">Nenhuma atividade recente</h4>
                <p className="text-xs text-muted-foreground">
                  As atividades do chat aparecerão aqui quando houver mensagens.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
