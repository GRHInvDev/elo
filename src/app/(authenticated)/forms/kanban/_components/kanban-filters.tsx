"use client"

import { useState, useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { UserSearch } from "@/components/forms/user-search"
import { SetorSearch } from "@/components/forms/setor-search"
import { DateRangePicker } from "@/components/forms/date-range-picker"
import { Filter, X, Hash, Tag, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"
import { MultiSelect } from "@/components/forms/multi-select"
import { Input } from "@/components/ui/input"

interface KanbanFiltersProps {
  filters: KanbanFiltersState
  onFiltersChange: (filters: KanbanFiltersState) => void
}

export interface KanbanFiltersState {
  startDate?: Date
  endDate?: Date
  priority?: "ASC" | "DESC"
  userIds: string[]
  setores: string[]
  tagIds: string[]
  formIds: string[]
  number?: string
  hasResponse?: boolean
}

export function KanbanFilters({ filters, onFiltersChange }: KanbanFiltersProps) {
  const [localNumber, setLocalNumber] = useState(filters.number ?? "")
  const [isOpen, setIsOpen] = useState(true)

  // Sync local state when external filters change
  useEffect(() => {
    setLocalNumber(filters.number ?? "")
  }, [filters.number])

  // Debounce filter updates
  useEffect(() => {
    const handler = setTimeout(() => {
      if ((filters.number ?? "") !== localNumber) {
        onFiltersChange({ ...filters, number: localNumber || undefined })
      }
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [localNumber, filters, onFiltersChange])

  // Buscar usuários, tags e formulários (que o usuário é responsável) para os filtros
  const { data: usersData } = api.user.listForChat.useQuery({})
  const { data: tagsData } = api.formResponse.getTags.useQuery()
  const { data: formsData } = api.form.listForKanbanFilter.useQuery()

  // Converter dados do backend para o formato do UserSearch
  const users = (usersData ?? []).map(user => ({
    id: user.id,
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
    email: user.email,
    setor: user.setor,
  }))

  const hasActiveFilters =
    filters.startDate !== undefined ||
    filters.endDate !== undefined ||
    filters.priority !== undefined ||
    filters.userIds.length > 0 ||
    filters.setores.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.formIds.length > 0 ||
    filters.number !== undefined ||
    filters.hasResponse !== undefined

  const clearFilters = () => {
    onFiltersChange({
      startDate: undefined,
      endDate: undefined,
      priority: undefined,
      userIds: [],
      setores: [],
      tagIds: [],
      formIds: [],
      number: undefined,
      hasResponse: undefined,
    })
  }

  return (
    <Card className="mb-6 shadow-sm border-muted/60 relative z-10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 text-left rounded-md outline-none ring-primary focus-visible:ring-2 focus-visible:ring-offset-2",
                  "hover:opacity-80 transition-opacity"
                )}
              >
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-5 w-5 text-primary" />
                  Filtros Avançados
                </CardTitle>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
                )}
              </button>
            </CollapsibleTrigger>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  clearFilters()
                }}
                className="text-muted-foreground hover:text-destructive transition-colors h-8 px-2 shrink-0"
              >
                <X className="mr-2 h-3.5 w-3.5" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Filtro por Número */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              Número
            </Label>
            <Input
              type="text"
              placeholder="Ex: 210"
              className="bg-background"
              value={localNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "")
                setLocalNumber(val)
              }}
            />
          </div>

          {/* Filtro por Pessoa */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Solicitante</Label>
            <UserSearch
              users={users}
              selectedUsers={filters.userIds}
              onSelectionChange={(userIds) => {
                onFiltersChange({ ...filters, userIds })
              }}
              placeholder="Buscar por pessoa..."
              maxHeight="200px"
              className="bg-background"
            />
          </div>

          {/* Filtro por Setor */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Setor</Label>
            <SetorSearch
              selectedSetores={filters.setores}
              onSelectionChange={(setores) => {
                onFiltersChange({ ...filters, setores })
              }}
              placeholder="Buscar por setor..."
              maxHeight="200px"
              className="bg-background"
            />
          </div>

          {/* Filtro por Formulário (responsável ou vínculo) */}
          {formsData && formsData.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                Formulário
              </Label>
              <MultiSelect
                options={(formsData ?? []).map((f) => ({ label: f.title ?? f.id, value: f.id }))}
                selected={filters.formIds}
                onChange={(formIds) => onFiltersChange({ ...filters, formIds })}
                placeholder="Todos os formulários..."
                className="bg-background relative z-20"
              />
            </div>
          )}

          {/* STATUS E PRIORIDADE */}

          {/* Filtro por Respondido */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Status</Label>
            <Select
              value={
                filters.hasResponse === undefined
                  ? "all"
                  : filters.hasResponse
                    ? "responded"
                    : "not_responded"
              }
              onValueChange={(value) => {
                onFiltersChange({
                  ...filters,
                  hasResponse:
                    value === "all"
                      ? undefined
                      : value === "responded"
                        ? true
                        : false,
                })
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="responded">Respondidos</SelectItem>
                <SelectItem value="not_responded">Não Respondidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SEGUNDA LINHA */}

          {/* Filtro por Prioridade */}
          <div className="space-y-2 flex flex-col justify-end">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Prioridade</Label>
            <Select
              value={filters.priority ?? "all"}
              onValueChange={(value) => {
                onFiltersChange({
                  ...filters,
                  priority: value === "all" ? undefined : (value as "ASC" | "DESC"),
                })
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione a ordenação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Padrão</SelectItem>
                <SelectItem value="ASC">Menor Urgência (ASC)</SelectItem>
                <SelectItem value="DESC">Maior Urgência (DESC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Tags */}
          <div className="space-y-2 flex flex-col justify-end">
            <Label className="flex items-center text-xs font-semibold uppercase text-muted-foreground">
              Tags
            </Label>
            <MultiSelect
              options={(tagsData ?? []).map(tag => ({ label: tag.nome, value: tag.id }))}
              selected={filters.tagIds}
              onChange={(tagIds) => onFiltersChange({ ...filters, tagIds })}
              placeholder="Selecionar tags..."
              className="bg-background relative z-20"
            />
          </div>

          {/* Filtro por Data (Espaço Duplo) */}
          <div className="lg:col-span-2 space-y-2">
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onStartDateChange={(date) => {
                onFiltersChange({ ...filters, startDate: date })
              }}
              onEndDateChange={(date) => {
                onFiltersChange({ ...filters, endDate: date })
              }}
              className="w-full bg-background"
            />
            </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

