"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { api } from "@/trpc/react"
import { useUser } from "@clerk/nextjs"
import { Search, Users, UserCheck, ChevronDown, ChevronRight, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string | null
  enterprise: string
  setor: string | null
}

interface UsersListProps {
  onUserDoubleClick: (userId: string) => void
  className?: string
}

export function UsersList({ onUserDoubleClick, className }: UsersListProps) {
  const { user: clerkUser } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set())

  // Buscar usuários online
  const { data: onlineData } = api.adminChatGroups.getAvailableUsers.useQuery({
    search: searchTerm || undefined,
  })

  // Buscar status de presença online
  const { data: presenceData } = useQuery({
    queryKey: ['online-users'],
    queryFn: async (): Promise<{ onlineUserIds: string[], totalOnline: number }> => {
      const response = await fetch('/api/chat/online')
      if (response.ok) {
        const data = await response.json() as unknown as { onlineUserIds: string[], totalOnline: number }
        return data
      }
      return { onlineUserIds: [], totalOnline: 0 }
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  })

  const onlineUserIds = new Set(presenceData?.onlineUserIds)
  const allUsers = onlineData ?? []

  // Filtrar apenas usuários que não são do setor "Sistema"
  const allColaborators = allUsers.filter(user => user.setor !== 'Sistema')

  const isLoading = !onlineData

  // Agrupar usuários por setor
  const usersBySector = allColaborators.reduce((acc, user) => {
    const sector = user.setor ?? 'Sem Setor'
    const sectorUsers = acc[sector] ?? []
    sectorUsers.push(user)
    acc[sector] = sectorUsers
    return acc
  }, {} as Record<string, User[]>)

  // Toggle setor expandido
  const toggleSector = (sector: string) => {
    const newExpanded = new Set(expandedSectors)
    if (newExpanded.has(sector)) {
      newExpanded.delete(sector)
    } else {
      newExpanded.add(sector)
    }
    setExpandedSectors(newExpanded)
  }

  const formatUserName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    }
    return user.email
  }

  const handleUserDoubleClick = (userId: string) => {
    if (userId !== clerkUser?.id) {
      onUserDoubleClick(userId)
    }
  }

  return (
    <div className={cn("border-l bg-muted/30 flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="font-semibold">Colaboradores</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {allColaborators.length} total • {presenceData?.totalOnline ?? 0} online
          </Badge>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista de usuários por setor */}
      <div
        className="overflow-y-auto"
        style={{ height: 'calc(100vh - 200px)', maxHeight: '600px', minHeight: '200px' }}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3">
                <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2">
            {Object.keys(usersBySector).length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  Nenhum colaborador encontrado
                </p>
              </div>
            ) : searchTerm ? (
              // Modo de busca: lista plana sem setores
              <div className="space-y-1">
                {allColaborators
                  .filter((user: User) =>
                    formatUserName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((user: User) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors group",
                        "hover:bg-muted/50",
                        user.id === clerkUser?.id && "bg-primary/5"
                      )}
                      onDoubleClick={() => handleUserDoubleClick(user.id)}
                      title="Clique duas vezes para iniciar conversa privada"
                    >
                      {/* Avatar com indicador online */}
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.imageUrl ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {user.firstName?.charAt(0) ?? user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Indicador online */}
                        {onlineUserIds.has(user.id) && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                        )}
                      </div>

                      {/* Informações do usuário */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {formatUserName(user)}
                          </p>
                          {user.id === clerkUser?.id && (
                            <UserCheck className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs h-5">
                            {user.enterprise}
                          </Badge>
                          {user.setor && (
                            <Badge variant="secondary" className="text-xs h-5">
                              {user.setor}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              // Modo normal: setores agrupados
              <div className="space-y-2">
                {Object.entries(usersBySector)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([sector, sectorUsers]) => (
                    <Collapsible
                      key={sector}
                      open={expandedSectors.has(sector)}
                      onOpenChange={() => toggleSector(sector)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{sector}</span>
                          <Badge variant="secondary" className="text-xs">
                            {sectorUsers.length}
                          </Badge>
                        </div>
                        {expandedSectors.has(sector) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CollapsibleTrigger>

                      <CollapsibleContent className="space-y-1 mt-1">
                        {sectorUsers.map((user) => (
                          <div
                            key={user.id}
                            className={cn(
                              "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors group ml-4",
                              "hover:bg-muted/50",
                              user.id === clerkUser?.id && "bg-primary/5"
                            )}
                            onDoubleClick={() => handleUserDoubleClick(user.id)}
                            title="Clique duas vezes para iniciar conversa privada"
                          >
                            {/* Avatar com indicador online */}
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.imageUrl ?? undefined} />
                                <AvatarFallback className="text-xs">
                                  {user.firstName?.charAt(0) ?? user.email.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {/* Indicador online */}
                              {onlineUserIds.has(user.id) && (
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                              )}
                            </div>

                            {/* Informações do usuário */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {formatUserName(user)}
                                </p>
                                {user.id === clerkUser?.id && (
                                  <UserCheck className="h-3 w-3 text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs h-5">
                                  {user.enterprise}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
