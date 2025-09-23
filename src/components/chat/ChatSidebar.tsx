"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Hash, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"
import { useUser } from "@clerk/nextjs"

interface Room {
  id: string
  name: string
  description: string
  type: 'global' | 'private' | 'group'
  memberCount?: number
}

interface Group {
  id: string
  name: string
  description: string | null
  members: Array<{
    user: {
      id: string
      firstName: string | null
      lastName: string | null
      email: string
      imageUrl: string | null
    }
  }>
}

interface ChatSidebarProps {
  currentRoomId: string
  onRoomChange: (roomId: string) => void
  className?: string
}

export function ChatSidebar({ currentRoomId, onRoomChange, className }: ChatSidebarProps) {
  const { user: clerkUser } = useUser()

  // Buscar grupos do usuário
  const userGroupsQuery = api.chatMessage.getUserGroups.useQuery(
    undefined,
    { enabled: !!clerkUser?.id }
  )

  // Buscar conversas ativas
  const activeConversationsQuery = api.chatMessage.getActiveConversations.useQuery(
    undefined,
    { enabled: !!clerkUser?.id }
  )

  // Chat global sempre disponível
  const globalRoom: Room = {
    id: 'global',
    name: 'Chat Global',
    description: 'Sala de chat geral da empresa',
    type: 'global',
  }

  // Combinar chat global com grupos do usuário
  const allRooms: Room[] = [globalRoom]

  if (userGroupsQuery.data) {
    const groupRooms: Room[] = userGroupsQuery.data.map((group: Group) => ({
      id: `group_${group.id}`,
      name: group.name,
      description: group.description ?? 'Grupo de chat privado',
      type: 'group' as const,
      memberCount: group.members.length,
    }))
    allRooms.push(...groupRooms)
  }

  const activeConversations = activeConversationsQuery.data ?? []
  const isLoading = userGroupsQuery.isLoading || activeConversationsQuery.isLoading

  return (
    <div className={cn("w-64 border-r bg-muted/30 flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Salas</h2>
        </div>
      </div>

      {/* Conteúdo rolável */}
      <div className="flex-1 overflow-y-auto">
        {/* Conversas Ativas */}
        {activeConversations.length > 0 && (
          <div className="p-2 border-b border-border/50">
            <div className="px-2 py-1">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Conversas Ativas
              </h3>
            </div>
            <div className="space-y-1">
              {activeConversations.map((conversation) => (
                <Button
                  key={conversation.roomId}
                  variant={currentRoomId === conversation.roomId ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3",
                    currentRoomId === conversation.roomId && "bg-primary/10"
                  )}
                  onClick={() => onRoomChange(conversation.roomId)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      {conversation.roomType === 'global' ? (
                        <Hash className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{conversation.roomName}</span>
                        {conversation.memberCount !== undefined && conversation.memberCount > 0 && (
                          <Badge variant="secondary" className="text-xs h-5 flex-shrink-0">
                            {conversation.memberCount}
                          </Badge>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage.user.firstName || conversation.lastMessage.user.lastName
                              ? `${conversation.lastMessage.user.firstName || ''} ${conversation.lastMessage.user.lastName || ''}`.trim()
                              : 'Usuário'
                            }: {conversation.lastMessage.content || 'Mensagem sem texto'}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {(() => {
                              const now = new Date()
                              const messageTime = new Date(conversation.lastMessage.createdAt)
                              const diffMs = now.getTime() - messageTime.getTime()
                              const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                              const diffDays = Math.floor(diffHours / 24)

                              if (diffHours < 1) {
                                const diffMinutes = Math.floor(diffMs / (1000 * 60))
                                return diffMinutes <= 1 ? 'agora' : `${diffMinutes}min atrás`
                              } else if (diffHours < 24) {
                                return `${diffHours}h atrás`
                              } else if (diffDays === 1) {
                                return 'ontem'
                              } else {
                                return `${diffDays}d atrás`
                              }
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Todas as Salas */}
        <div className="p-2">
          <div className="px-2 py-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Todas as Salas
            </h3>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {allRooms.map((room) => (
                <Button
                  key={room.id}
                  variant={currentRoomId === room.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3",
                    currentRoomId === room.id && "bg-primary/10"
                  )}
                  onClick={() => onRoomChange(room.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      {room.type === 'global' ? (
                        <Hash className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{room.name}</span>
                        {room.memberCount !== undefined && room.memberCount > 0 && (
                          <Badge variant="secondary" className="text-xs h-5">
                            {room.memberCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {room.description}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
