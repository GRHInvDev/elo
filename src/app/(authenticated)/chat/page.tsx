"use client"

import { useState } from "react"
import { ChatRoom, ChatSidebar } from "@/components/chat"
import { DashboardShell } from "@/components/dashboard-shell"
import { useAccessControl } from "@/hooks/use-access-control"
import { useUser } from "@clerk/nextjs"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UsersList } from "@/app/(authenticated)/chat/_components/users-list"

export default function ChatPage() {
  const { user: clerkUser } = useUser()
  const { canAccessChat, isLoading } = useAccessControl()
  const [currentRoomId, setCurrentRoomId] = useState("global")

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
      <div className="w-full max-w-full h-[calc(100vh-12rem)] flex border rounded-lg overflow-hidden bg-background">
        {/* Sidebar esquerdo com salas/grupos */}
        <ChatSidebar
          currentRoomId={currentRoomId}
          onRoomChange={setCurrentRoomId}
          className="hidden lg:block w-96 h-full"
        />

        {/* Área principal do chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatRoom roomId={currentRoomId} className="flex-1" />
        </div>

        {/* Sidebar direito com lista de usuários */}
        <UsersList
          onUserDoubleClick={(userId) => {
            // Criar ou navegar para chat privado com o usuário
            const privateChatId = `private_${[clerkUser?.id, userId].sort().join('_')}`
            setCurrentRoomId(privateChatId)
          }}
          className="hidden xl:block w-96 h-full"
        />
      </div>
    </DashboardShell>
  )
}
