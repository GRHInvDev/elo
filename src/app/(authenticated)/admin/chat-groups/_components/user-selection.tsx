"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { api } from "@/trpc/react"
import { Search, Users, X } from "lucide-react"
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

interface UserSelectionProps {
  selectedUsers: string[]
  onSelectionChange: (userIds: string[]) => void
  excludeGroupId?: string
  className?: string
}

export function UserSelection({
  selectedUsers,
  onSelectionChange,
  excludeGroupId,
  className
}: UserSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Buscar usuários disponíveis
  const { data: availableUsers, isLoading } = api.adminChatGroups.getAvailableUsers.useQuery({
    search: searchTerm || undefined,
    excludeGroupId,
  })

  // Filtrar usuários selecionados
  const selectedUsersData = useMemo(() => {
    if (!availableUsers) return []
    return availableUsers.filter(user => selectedUsers.includes(user.id))
  }, [availableUsers, selectedUsers])

  const handleUserToggle = useCallback((userId: string) => {
    const isSelected = selectedUsers.includes(userId)
    if (isSelected) {
      onSelectionChange(selectedUsers.filter(id => id !== userId))
    } else {
      onSelectionChange([...selectedUsers, userId])
    }
  }, [selectedUsers, onSelectionChange])

  const handleRemoveUser = useCallback((userId: string) => {
    onSelectionChange(selectedUsers.filter(id => id !== userId))
  }, [selectedUsers, onSelectionChange])

  const handleSelectAllToggle = () => {
    if (!availableUsers || availableUsers.length === 0) return

    const visibleUserIds = availableUsers.map(user => user.id)
    const currentlySelectedCount = visibleUserIds.filter(id => selectedUsers.includes(id)).length
    const shouldSelectAll = currentlySelectedCount < visibleUserIds.length

    if (shouldSelectAll) {
      // Selecionar todos
      onSelectionChange([...new Set([...selectedUsers, ...visibleUserIds])])
    } else {
      // Desselecionar todos os visíveis
      onSelectionChange(selectedUsers.filter(id => !visibleUserIds.includes(id)))
    }
  }

  const formatUserName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    }
    return user.email
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Usuários selecionados */}
      {selectedUsersData.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Membros Selecionados ({selectedUsers.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedUsersData.map((user) => (
              <Badge key={user.id} variant="secondary" className="flex items-center gap-2">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={user.imageUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {user.firstName?.charAt(0) ?? user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{formatUserName(user)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveUser(user.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Busca de usuários */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Buscar Usuários
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista de usuários disponíveis */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Usuários Disponíveis
          </Label>
          {availableUsers && availableUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={availableUsers.every(user => selectedUsers.includes(user.id))}
                onCheckedChange={handleSelectAllToggle}
              />
              <Label htmlFor="select-all" className="text-sm font-normal cursor-pointer">
                Selecionar todos ({availableUsers.length})
              </Label>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : !availableUsers || availableUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="h-64 border rounded-md overflow-y-auto">
            <div className="p-4 space-y-2">
              {availableUsers.map((user) => {
                const isSelected = selectedUsers.includes(user.id)
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
                    )}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleUserToggle(user.id)}
                      className="pointer-events-none"
                    />

                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.imageUrl ?? undefined} />
                      <AvatarFallback>
                        {user.firstName?.charAt(0) ?? user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {formatUserName(user)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        {user.enterprise}
                      </Badge>
                      {user.setor && (
                        <Badge variant="secondary" className="text-xs">
                          {user.setor}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente auxiliar para Label
function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-sm font-medium leading-none", className)} {...props}>
      {children}
    </label>
  )
}