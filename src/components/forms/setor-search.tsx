"use client"

import { cn } from "@/lib/utils"

import { useState, useMemo } from "react"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, X, Building2, Check, ChevronDown } from "lucide-react"

interface SetorSearchProps {
  selectedSetores: string[]
  onSelectionChange: (setores: string[]) => void
  placeholder?: string
  maxHeight?: string
  className?: string
}

export function SetorSearch({
  selectedSetores,
  onSelectionChange,
  placeholder = "Buscar setores...",
  maxHeight = "200px",
  className,
}: SetorSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const { data: distinctSetores = [] } = api.user.listDistinctSetores.useQuery()
  const { data: setoresTable = [] } = api.setores.list.useQuery()

  const availableSetores = useMemo(() => {
    return distinctSetores.map((setorValue) => {
      const matched = setoresTable.find((s) => s.value === setorValue)
      return {
        value: setorValue,
        label: matched?.name ?? setorValue,
      }
    })
  }, [distinctSetores, setoresTable])

  // Filtrar setores baseado no termo de busca
  const filteredSetores = useMemo(() => {
    if (!searchTerm.trim()) return availableSetores

    const term = searchTerm.toLowerCase()
    return availableSetores.filter(
      (setor) =>
        setor.label.toLowerCase().includes(term) ||
        setor.value.toLowerCase().includes(term)
    )
  }, [searchTerm, availableSetores])

  // Setores selecionados para exibição
  const selectedSetoresData = useMemo(() => {
    return selectedSetores.map((val) => {
      const found = availableSetores.find((s) => s.value === val)
      return found ?? { value: val, label: val }
    })
  }, [selectedSetores, availableSetores])


  const handleSetorToggle = (setorValue: string) => {
    if (selectedSetores.includes(setorValue)) {
      onSelectionChange(selectedSetores.filter(value => value !== setorValue))
    } else {
      onSelectionChange([...selectedSetores, setorValue])
    }
  }

  const handleRemoveSetor = (setorValue: string) => {
    onSelectionChange(selectedSetores.filter(value => value !== setorValue))
  }

  const handleSelectAll = () => {
    if (selectedSetores.length === filteredSetores.length) {
      // Desmarcar todos os setores filtrados
      const filteredSetorValues = filteredSetores.map(setor => setor.value)
      onSelectionChange(selectedSetores.filter(value => !filteredSetorValues.includes(value)))
    } else {
      // Marcar todos os setores filtrados
      const filteredSetorValues = filteredSetores.map(setor => setor.value)
      const newSelection = [...new Set([...selectedSetores, ...filteredSetorValues])]
      onSelectionChange(newSelection)
    }
  }

  const isAllSelected = filteredSetores.length > 0 &&
    filteredSetores.every(setor => selectedSetores.includes(setor.value))

  return (
    <div className={cn("space-y-3", className)}>
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
                {selectedSetores.length > 0
                  ? `${selectedSetores.length} setor(es) selecionado(s)`
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
              placeholder="Buscar setor..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList style={{ maxHeight }}>
              <CommandEmpty>
                {searchTerm ? "Nenhum setor encontrado." : "Digite para buscar setores..."}
              </CommandEmpty>

              {filteredSetores.length > 0 && (
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
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">
                        {isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {filteredSetores.length}
                      </Badge>
                    </div>
                  </CommandItem>

                  {/* Lista de setores */}
                  {filteredSetores.map((setor) => {
                    const isSelected = selectedSetores.includes(setor.value)

                    return (
                      <CommandItem
                        key={setor.value}
                        onSelect={() => handleSetorToggle(setor.value)}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {setor.label}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-green-600" />
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

      {/* Setores selecionados */}
      {selectedSetoresData.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/50">
          {selectedSetoresData.map((setor) => (
            <Badge
              key={setor.value}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="truncate max-w-[200px]">
                {setor.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveSetor(setor.value)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

