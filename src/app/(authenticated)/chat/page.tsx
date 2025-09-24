"use client"

import { useState } from "react"
import { ChatRoom, ChatSidebar } from "@/components/chat"
import { DashboardShell } from "@/components/dashboard-shell"
import { useAccessControl } from "@/hooks/use-access-control"
import { useUser } from "@clerk/nextjs"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { api } from "@/trpc/react"

export default function ChatPage() {
  const { user: clerkUser } = useUser()
  const { canAccessChat, isLoading } = useAccessControl()
  const [currentRoomId, setCurrentRoomId] = useState("global")
  const [showSidebar, setShowSidebar] = useState(false)

  // Buscar informações do usuário atual para obter o ID do banco
  const { data:currentUser } = api.user.getCurrent.useQuery(
    undefined,
    { enabled: !!clerkUser?.id }
  )

  if (isLoading) {
    return (
      <DashboardShell className="flex justify-center">
        <div className="w-full max-w-6xl h-[calc(100vh-12rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando permissões...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (!canAccessChat()) {
    return (
      <DashboardShell className="flex justify-center">
        <div className="w-full max-w-2xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar o chat interno.
              Entre em contato com um administrador se acredita que isso é um erro.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell className="flex justify-center">
      <div className="w-full max-w-full h-[calc(100vh-12rem)] flex border rounded-lg bg-background relative overflow-hidden">
        {/* Sidebar unificada */}
        <div className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 absolute lg:relative z-50 lg:z-auto transition-transform duration-300 ease-in-out w-72 lg:w-80 h-full flex-shrink-0`}>
          <ChatSidebar
            currentRoomId={currentRoomId}
            onRoomChange={(roomId) => {
              setCurrentRoomId(roomId)
              setShowSidebar(false) // Fechar sidebar em mobile após seleção
            }}
            className="w-full h-full"
          />
        </div>

        {/* Overlay para mobile quando sidebar estiver aberta */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Área principal do chat */}
        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          {/* Header com botão para mobile */}
          <div className="lg:hidden flex items-center p-3 border-b bg-muted/50 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </Button>
          </div>

          <ChatRoom roomId={currentRoomId} className="flex-1 overflow-hidden" />
        </div>
      </div>
    </DashboardShell>
  )
}
