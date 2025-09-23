"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Hash, Users, MessageCircle, Building2, Phone, Search, UserCheck, ChevronDown, ChevronRight, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"

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

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string | null
  enterprise: string
  setor: string | null
}

interface ChatSidebarProps {
  currentRoomId: string
  onRoomChange: (roomId: string) => void
  onUserDoubleClick: (userId: string) => void
  className?: string
}

export function ChatSidebar({ currentRoomId, onRoomChange, onUserDoubleClick, className }: ChatSidebarProps) {
  const { user: clerkUser } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("conversas")
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set())

  // Buscar grupos do usuário
  const { data: userGroupsData, isLoading: isLoadingGroups } = api.chatMessage.getUserGroups.useQuery(
    undefined,
    { enabled: !!clerkUser?.id }
  )

  // Buscar conversas ativas
  const { data: activeConversationsData, isLoading: isLoadingConversations } = api.chatMessage.getActiveConversations.useQuery(
    undefined,
    { enabled: !!clerkUser?.id }
  )

  // Buscar todos os colaboradores
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError
  } = api.user.listForChat.useQuery({
    search: searchTerm.trim() || undefined,
  }, {
    enabled: activeTab === "colaboradores"
  })

  // Log de erro se houver
  if (usersError) {
    console.error('Erro ao buscar usuários:', usersError)
  }

  // Buscar status de presença online
  const { data: presenceData } = useQuery({
    queryKey: ['online-users'],
    queryFn: async (): Promise<{ onlineUserIds: string[], totalOnline: number }> => {
      try {
        const response = await fetch('/api/chat/online')
        if (response.ok) {
          const data = await response.json() as unknown as { onlineUserIds: string[], totalOnline: number }
          return data
        }
      } catch (error) {
        console.error('Erro ao buscar status online:', error)
      }
      return { onlineUserIds: [], totalOnline: 0 }
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })

  // Processar dados
  const onlineUserIds = new Set(presenceData?.onlineUserIds ?? [])

  const allUsers = usersData ?? []
  const allColaborators = allUsers.filter((user: User) =>
    user.setor !== 'Sistema' &&
    user.setor !== 'Sem setor' &&
    user.setor !== 'TESTE'
  )

  // Agrupar colaboradores por setor
  const collaboratorsBySector = allColaborators.reduce((acc: Record<string, User[]>, user: User) => {
    const sector = user.setor ?? 'Sem Setor'
    const sectorUsers = acc[sector] ?? []
    sectorUsers.push(user)
    acc[sector] = sectorUsers
    return acc
  }, {} as Record<string, User[]>)

  // Filtrar colaboradores por busca
  const filteredCollaborators = (() => {
    try {
      const trimmedSearch = searchTerm.trim().toLowerCase()
      if (!trimmedSearch) return allColaborators

      return allColaborators.filter((user: User) => {
        const userName = formatUserName(user).toLowerCase()
        const email = user.email.toLowerCase()
        const setor = user.setor?.toLowerCase() ?? ''
        const enterprise = user.enterprise.toLowerCase()

        return userName.includes(trimmedSearch) ||
               email.includes(trimmedSearch) ||
               setor.includes(trimmedSearch) ||
               enterprise.includes(trimmedSearch)
      })
    } catch (error) {
      console.error('Erro ao filtrar colaboradores:', error)
      return allColaborators
    }
  })()

  const activeConversations = (activeConversationsData ?? []) as Array<{
    roomId: string
    roomName: string
    roomType: 'global' | 'group' | 'private'
    lastMessage: {
      content: string | null
      createdAt: Date
      user: {
        firstName: string | null
        lastName: string | null
      }
    } | null
    memberCount?: number
  }>

  const userGroups = userGroupsData ?? []

  const isLoading = isLoadingGroups || isLoadingConversations || (activeTab === "colaboradores" && isLoadingUsers)

  // Toggle setor expandido
  const toggleSector = (sector: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sector)) {
        newSet.delete(sector)
      } else {
        newSet.add(sector)
      }
      return newSet
    })
  }

  // Funções auxiliares
  const formatUserName = (user: { firstName: string | null; lastName: string | null; email?: string }) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    }
    return user.email ?? 'Usuário'
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
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
  }

  return (
    <div className={cn("w-full border-r bg-muted/30 flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="font-semibold">Chat</h2>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-128 grid-cols-4 mx-4 mt-2 mb-2 flex-shrink-0 gap-1">
          <TabsTrigger value="conversas" className="text-xs p-2 h-8" title="Conversas">
            <MessageCircle className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="grupos" className="text-xs p-2 h-8" title="Grupos">
            <Building2 className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="colaboradores" className="text-xs p-2 h-8" title="Colaboradores">
            <Users className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="ramal" className="text-xs p-2 h-8" title="Ramal">
            <Phone className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

      {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Aba Conversas */}
          <TabsContent value="conversas" className="mt-0 flex-1 min-h-0">
            <div className="p-2 h-full overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              ) : activeConversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h4 className="text-sm font-medium mb-2">Nenhuma conversa ativa</h4>
                  <p className="text-xs text-muted-foreground">
                    Suas conversas recentes aparecerão aqui
                  </p>
            </div>
              ) : (
            <div className="space-y-1">
                  {/* Chat Global sempre aparece primeiro */}
                  <Button
                    key="global"
                    variant={currentRoomId === "global" ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-3",
                      currentRoomId === "global" && "bg-primary/10"
                    )}
                    onClick={() => onRoomChange("global")}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">Chat Global</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Sala de chat geral da empresa
                        </p>
                      </div>
                    </div>
                  </Button>

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
                      ) : conversation.roomType === 'private' ? (
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
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
                            {(() => {
                                  const userName = formatUserName(conversation.lastMessage.user)
                              const content = conversation.lastMessage.content ?? 'Mensagem sem texto'
                              return `${userName}: ${content}`
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                                {formatTimeAgo(conversation.lastMessage.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
          </div>
        )}
          </div>
          </TabsContent>

          {/* Aba Grupos */}
          <TabsContent value="grupos" className="mt-0 flex-1 min-h-0">
            <div className="p-2 h-full overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
                  {/* Chat Global sempre aparece */}
                <Button
                    key="global"
                    variant={currentRoomId === "global" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3",
                      currentRoomId === "global" && "bg-primary/10"
                  )}
                    onClick={() => onRoomChange("global")}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">Chat Global</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Sala de chat geral da empresa
                        </p>
                      </div>
                    </div>
                  </Button>

                  {/* Grupos do usuário */}
                  {userGroups.length > 0 && (
                    <>
                      <div className="px-2 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Seus Grupos
                      </div>
                      {userGroups.map((group: Group) => (
                        <Button
                          key={group.id}
                          variant={currentRoomId === `group_${group.id}` ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start h-auto p-3",
                            currentRoomId === `group_${group.id}` && "bg-primary/10"
                          )}
                          onClick={() => onRoomChange(`group_${group.id}`)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex-shrink-0">
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{group.name}</span>
                          <Badge variant="secondary" className="text-xs h-5">
                                  {group.members.length}
                          </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {group.description ?? 'Grupo de chat'}
                              </p>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Aba Colaboradores */}
          <TabsContent value="colaboradores" className="mt-0 flex-1 min-h-0">
            <div className="p-2 h-full overflow-y-auto">
              {/* Busca */}
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar colaborador..."
                    value={searchTerm}
                    onChange={(e) => {
                      try {
                        // Limitar tamanho e remover caracteres potencialmente problemáticos
                        const value = e.target.value.slice(0, 100).replace(/[<>]/g, '')
                        setSearchTerm(value)
                      } catch (error) {
                        console.error('Erro ao atualizar busca:', error)
                        setSearchTerm('')
                      }
                    }}
                    className="pl-9 h-9"
                    maxLength={100}
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-3">
                      <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse"></div>
                        <div className="h-2 bg-muted rounded w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : usersError ? (
                <div className="text-center py-8 px-4">
                  <div className="text-destructive mb-3">⚠️</div>
                  <h4 className="text-sm font-medium mb-2">Erro ao carregar colaboradores</h4>
                  <p className="text-xs text-muted-foreground">
                    Não foi possível carregar a lista de colaboradores.
                  </p>
                </div>
              ) : filteredCollaborators.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h4 className="text-sm font-medium mb-2">
                    {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum colaborador encontrado'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {searchTerm
                      ? `Não encontramos colaboradores para "${searchTerm}"`
                      : 'Não há colaboradores disponíveis no momento.'
                    }
                  </p>
                </div>
              ) : searchTerm ? (
                // Modo de busca: lista plana
                <div className="space-y-1">
                  {filteredCollaborators.map((user: User) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors group",
                        "hover:bg-muted/50 active:bg-muted/70",
                        user.id === clerkUser?.id && "bg-primary/5"
                      )}
                      onDoubleClick={() => onUserDoubleClick(user.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Conversar com ${formatUserName(user)}${onlineUserIds.has(user.id) ? ' (online)' : ''}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onUserDoubleClick(user.id)
                        }
                      }}
                    >
                      {/* Avatar com indicador online */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.imageUrl ?? undefined} alt={formatUserName(user)} />
                          <AvatarFallback className="text-xs font-medium">
                            {user.firstName?.charAt(0)?.toUpperCase() ?? user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Indicador online */}
                        {onlineUserIds.has(user.id) && (
                          <div
                            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full"
                            aria-label="Usuário online"
                          />
                        )}
                      </div>

                      {/* Informações do usuário */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {formatUserName(user)}
                          </p>
                          {user.id === clerkUser?.id && (
                            <UserCheck className="h-3 w-3 text-primary flex-shrink-0" aria-label="Você" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs h-5 px-1.5">
                            {user.enterprise}
                          </Badge>
                          {user.setor && (
                            <Badge variant="secondary" className="text-xs h-5 px-1.5">
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
                  {Object.entries(collaboratorsBySector)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([sector, sectorUsers]: [string, User[]]) => (
                      <Collapsible
                        key={sector}
                        open={expandedSectors.has(sector)}
                        onOpenChange={() => toggleSector(sector)}
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{sector}</span>
                            <Badge variant="secondary" className="text-xs">
                              {sectorUsers.length}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {expandedSectors.has(sector) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="space-y-1 mt-1">
                          {sectorUsers.map((user: User) => (
                            <div
                              key={user.id}
                              className={cn(
                                "flex items-center space-x-3 p-3 ml-4 rounded-lg cursor-pointer transition-colors group",
                                "hover:bg-muted/50 active:bg-muted/70",
                                user.id === clerkUser?.id && "bg-primary/5"
                              )}
                              onDoubleClick={() => onUserDoubleClick(user.id)}
                              role="button"
                              tabIndex={0}
                              aria-label={`Conversar com ${formatUserName(user)}${onlineUserIds.has(user.id) ? ' (online)' : ''}`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  onUserDoubleClick(user.id)
                                }
                              }}
                            >
                              {/* Avatar com indicador online */}
                              <div className="relative flex-shrink-0">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.imageUrl ?? undefined} alt={formatUserName(user)} />
                                  <AvatarFallback className="text-xs font-medium">
                                    {user.firstName?.charAt(0)?.toUpperCase() ?? user.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {/* Indicador online */}
                                {onlineUserIds.has(user.id) && (
                                  <div
                                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full"
                                    aria-label="Usuário online"
                                  />
                                )}
                              </div>

                              {/* Informações do usuário */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">
                                    {formatUserName(user)}
                                  </p>
                                  {user.id === clerkUser?.id && (
                                    <UserCheck className="h-3 w-3 text-primary flex-shrink-0" aria-label="Você" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs h-5 px-1.5">
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
          </TabsContent>

          {/* Aba Lista Ramal */}
          <TabsContent value="ramal" className="mt-0 flex-1 min-h-0">
            <div className="p-2 h-full overflow-y-auto">
              <div className="text-center py-16 px-4">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h4 className="text-sm font-medium mb-2">Lista de Ramal</h4>
                <p className="text-xs text-muted-foreground">
                  Em breve você poderá visualizar a lista de ramais aqui
                </p>
              </div>
            </div>
          </TabsContent>
      </div>
      </Tabs>
    </div>
  )
}
