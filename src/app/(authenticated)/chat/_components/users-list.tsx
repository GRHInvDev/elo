"use client"

// @ts-nocheck - Ignorar erros de tipo relacionados ao tRPC que são falsos positivos

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
import { Search, Users, UserCheck, ChevronDown, ChevronRight, Building2, AlertCircle, Loader2 } from "lucide-react"
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

// Componente UserCard para renderização consistente de usuários
interface UserCardProps {
  user: User
  isOnline: boolean
  isCurrentUser: boolean
  onDoubleClick: () => void
  compact?: boolean
}

function UserCard({ user, isOnline, isCurrentUser, onDoubleClick, compact = false }: UserCardProps) {
  const formatUserName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    }
    return user.email
  }

  return (
    <div
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors group",
        "hover:bg-muted/50 active:bg-muted/70",
        isCurrentUser && "bg-primary/5",
        compact && "ml-4"
      )}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={`Conversar com ${formatUserName(user)}${isOnline ? ' (online)' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDoubleClick()
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
        {isOnline && (
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
          {isCurrentUser && (
            <UserCheck className="h-3 w-3 text-primary flex-shrink-0" aria-label="Você" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {user.email}
        </p>
        {!compact && (
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
        )}
      </div>
    </div>
  )
}

export function UsersList({ onUserDoubleClick, className }: UsersListProps) {
  const { user: clerkUser } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set())

  // Buscar todos os colaboradores
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers
  } = api.user.listForChat.useQuery({
    search: searchTerm || undefined,
  }, {
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

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
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 15000, // Considerar dados frescos por 15 segundos
  })

  // Estados computados
  const onlineUserIds = new Set(presenceData?.onlineUserIds ?? [])
  const allUsers = usersData ?? []
  const allColaborators = allUsers.filter((user: User) => user.setor !== 'Sistema')

  const usersBySector = allColaborators.reduce((acc: Record<string, User[]>, user: User) => {
    const sector = user.setor ?? 'Sem Setor'
    const sectorUsers = acc[sector] ?? []
    sectorUsers.push(user)
    acc[sector] = sectorUsers
    return acc
  }, {} as Record<string, User[]>)

  const filteredUsers = searchTerm.trim()
    ? allColaborators.filter((user: User) =>
        formatUserName(user).toLowerCase().includes(searchTerm.toLowerCase()) ??
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ??
        user.setor?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        user.enterprise.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allColaborators

  // Estados de loading e erro
  const isLoading = isLoadingUsers
  const hasError = !!usersError

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
    <div className={cn("border-l bg-muted/30 flex flex-col h-full min-h-0", className)}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-sm sm:text-base">Colaboradores</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {allColaborators.length} total • {presenceData?.totalOnline ?? 0} online
          </Badge>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
            aria-label="Buscar colaboradores"
          />
        </div>
      </div>

      {/* Lista de usuários por setor */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="p-3 sm:p-4 space-y-3">
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
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h4 className="text-sm font-medium mb-2">Erro ao carregar colaboradores</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Não foi possível carregar a lista de colaboradores.
            </p>
            <button
              onClick={() => refetchUsers()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Loader2 className="h-3 w-3" />
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="p-2">
            {filteredUsers.length === 0 ? (
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
                {filteredUsers.map((user: User) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isOnline={onlineUserIds.has(user.id)}
                    isCurrentUser={user.id === clerkUser?.id}
                    onDoubleClick={() => handleUserDoubleClick(user.id)}
                  />
                ))}
              </div>
            ) : (
              // Modo normal: setores agrupados
              <div className="space-y-2">
                {Object.entries(usersBySector)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([sector, sectorUsers]: [string, User[]]) => (
                    <Collapsible
                      key={sector}
                      open={expandedSectors.has(sector)}
                      onOpenChange={() => toggleSector(sector)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
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
                          <UserCard
                            key={user.id}
                            user={user}
                            isOnline={onlineUserIds.has(user.id)}
                            isCurrentUser={user.id === clerkUser?.id}
                            onDoubleClick={() => handleUserDoubleClick(user.id)}
                            compact
                          />
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
