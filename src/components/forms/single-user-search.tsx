"use client"

import { cn } from "@/lib/utils"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Check, ChevronDown, UserX } from "lucide-react"

interface SingleUserSearchUser {
  id: string
  name: string
  email?: string | null
  setor?: string | null
}

interface SingleUserSearchProps {
  users: SingleUserSearchUser[]
  value: string | null
  onValueChange: (userId: string | null) => void
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  /** Rótulo da opção que limpa a seleção */
  clearLabel?: string
  /** Nome exibido quando o usuário selecionado não está presente na lista carregada */
  fallbackSelectedLabel?: string | null
  maxHeight?: string
  className?: string
}

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

export function SingleUserSearch({
  users,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Selecionar usuário...",
  searchPlaceholder = "Buscar por nome, email ou setor...",
  clearLabel = "Não atribuído",
  fallbackSelectedLabel = null,
  maxHeight = "200px",
  className,
}: SingleUserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSearchTerm("")
    }
  }

  // Filtrar usuários baseado no termo de busca (ignora acentuação)
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users

    const term = normalize(searchTerm)
    return users.filter(user =>
      normalize(user.name).includes(term) ||
      (user.email ? normalize(user.email).includes(term) : false) ||
      (user.setor ? normalize(user.setor).includes(term) : false)
    )
  }, [users, searchTerm])

  const selectedUser = users.find(user => user.id === value)
  const selectedLabel = selectedUser?.name ?? (value ? fallbackSelectedLabel : null)

  const handleSelect = (userId: string | null) => {
    onValueChange(userId)
    handleOpenChange(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedLabel ?? placeholder}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList style={{ maxHeight }}>
            <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>

            {!searchTerm.trim() && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleSelect(null)}
                  className="text-muted-foreground"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === null ? "opacity-100" : "opacity-0")} />
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    <span>{clearLabel}</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}

            {filteredUsers.length > 0 && (
              <CommandGroup>
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => handleSelect(user.id)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === user.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">
                        {user.name}
                      </span>
                      {(user.email ?? user.setor) && (
                        <span className="text-xs text-muted-foreground truncate block">
                          {user.email}
                          {user.email && user.setor && " • "}
                          {user.setor}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
