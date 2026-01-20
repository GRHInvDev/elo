"use client"

import { cn } from "@/lib/utils"

import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, X, Users, Check, ChevronDown } from "lucide-react"

interface User {
  id: string
  name: string
  email?: string | null
  setor?: string | null
}

interface UserSearchProps {
  users: User[]
  selectedUsers: string[]
  onSelectionChange: (userIds: string[]) => void
  placeholder?: string
  maxHeight?: string
  className?: string
}

export function UserSearch({
  users,
  selectedUsers,
  onSelectionChange,
  placeholder = "Buscar colaboradores...",
  maxHeight = "200px",
  className,
}: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  // Filtrar usuários baseado no termo de busca
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users

    const term = searchTerm.toLowerCase()
    return users.filter(user =>
      user.name.toLowerCase().includes(term) ||
      (user.email?.toLowerCase().includes(term) ?? false) ||
      (user.setor?.toLowerCase().includes(term) ?? false)
    )
  }, [users, searchTerm])

  // Usuários selecionados para exibição
  const selectedUsersData = useMemo(() => {
    return users.filter(user => selectedUsers.includes(user.id))
  }, [users, selectedUsers])

  const handleUserToggle = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onSelectionChange(selectedUsers.filter(id => id !== userId))
    } else {
      onSelectionChange([...selectedUsers, userId])
    }
  }

  const handleRemoveUser = (userId: string) => {
    onSelectionChange(selectedUsers.filter(id => id !== userId))
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      // Desmarcar todos os usuários filtrados
      const filteredUserIds = filteredUsers.map(user => user.id)
      onSelectionChange(selectedUsers.filter(id => !filteredUserIds.includes(id)))
    } else {
      // Marcar todos os usuários filtrados
      const filteredUserIds = filteredUsers.map(user => user.id)
      const newSelection = [...new Set([...selectedUsers, ...filteredUserIds])]
      onSelectionChange(newSelection)
    }
  }

  const isAllSelected = filteredUsers.length > 0 &&
    filteredUsers.every(user => selectedUsers.includes(user.id))

  return (
    <div className={cn("space-y-3", className)}>
      {/* Campo de busca */}
      <div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="truncate">
                  {selectedUsers.length > 0
                    ? `${selectedUsers.length} usuário(s) selecionado(s)`
                    : placeholder
                  }
                </span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Buscar por nome, email ou setor..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList style={{ maxHeight }}>
                <CommandEmpty>
                  {searchTerm ? "Nenhum usuário encontrado." : "Digite para buscar usuários..."}
                </CommandEmpty>

                {filteredUsers.length > 0 && (
                  <CommandGroup>
                    {/* Opção para selecionar/deselecionar todos */}
                    <CommandItem
                      onSelect={handleSelectAll}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        checked={isAllSelected}
                        className="pointer-events-none"
                      />
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">
                          {isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {filteredUsers.length}
                        </Badge>
                      </div>
                    </CommandItem>

                    {/* Lista de usuários */}
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUsers.includes(user.id)

                      return (
                        <CommandItem
                          key={user.id}
                          onSelect={() => handleUserToggle(user.id)}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            checked={isSelected}
                            className="pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {user.name}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {user.email && <span className="truncate">{user.email}</span>}
                              {user.email && user.setor && <span>•</span>}
                              {user.setor && (
                                <span className="truncate">{user.setor}</span>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Usuários selecionados */}
      {selectedUsersData.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Usuários Selecionados ({selectedUsersData.length})</Label>
          <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg bg-muted/50">
            {selectedUsersData.map((user) => (
              <Badge
                key={user.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span className="truncate max-w-[200px]">
                  {user.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveUser(user.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
