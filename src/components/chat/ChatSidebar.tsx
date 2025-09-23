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

  return (
    <div className={cn("w-64 border-r bg-muted/30", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Salas</h2>
        </div>
      </div>

      <div className="p-2">
        {userGroupsQuery.isLoading ? (
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
  )
}
