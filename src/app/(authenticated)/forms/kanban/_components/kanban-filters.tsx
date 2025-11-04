"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { UserSearch } from "@/components/forms/user-search"
import { SetorSearch } from "@/components/forms/setor-search"
import { DateRangePicker } from "@/components/forms/date-range-picker"
import { Filter, X } from "lucide-react"
import { api } from "@/trpc/react"

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
  hasResponse?: boolean
}

export function KanbanFilters({ filters, onFiltersChange }: KanbanFiltersProps) {
  // Buscar usuários para o UserSearch
  const { data: usersData } = api.user.listForChat.useQuery({})
  
  // Converter dados do backend para o formato do UserSearch
  const users = (usersData ?? []).map(user => ({
    id: user.id,
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
    email: user.email,
    setor: user.setor,
  }))

  const hasActiveFilters = 
    !filters.startDate ||
    !filters.endDate ||
    !filters.priority ||
    filters.userIds.length > 0 ||
    filters.setores.length > 0 ||
    filters.hasResponse !== undefined

  const clearFilters = () => {
    onFiltersChange({
      startDate: undefined,
      endDate: undefined,
      priority: undefined,
      userIds: [],
      setores: [],
      hasResponse: undefined,
    })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Filtro por Data */}
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(date) => {
              onFiltersChange({ ...filters, startDate: date })
            }}
            onEndDateChange={(date) => {
              onFiltersChange({ ...filters, endDate: date })
            }}
          />

          {/* Filtro por Prioridade */}
          <div className="space-y-2">
            <Label>Prioridade (Urgência)</Label>
            <Select
              value={filters.priority ?? "all"}
              onValueChange={(value) => {
                onFiltersChange({
                  ...filters,
                  priority: value === "all" ? undefined : (value as "ASC" | "DESC"),
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a ordenação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ASC">Menor Urgência (ASC)</SelectItem>
                <SelectItem value="DESC">Maior Urgência (DESC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Pessoa */}
          <div className="space-y-2">
            <Label>Solicitante</Label>
            <UserSearch
              users={users}
              selectedUsers={filters.userIds}
              onSelectionChange={(userIds) => {
                onFiltersChange({ ...filters, userIds })
              }}
              placeholder="Buscar por pessoa..."
              maxHeight="200px"
            />
          </div>

          {/* Filtro por Setor */}
          <div className="space-y-2">
            <Label>Setor</Label>
            <SetorSearch
              selectedSetores={filters.setores}
              onSelectionChange={(setores) => {
                onFiltersChange({ ...filters, setores })
              }}
              placeholder="Buscar por setor..."
              maxHeight="200px"
            />
          </div>

          {/* Filtro por Respondido */}
          <div className="space-y-2">
            <Label>Status de Resposta</Label>
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
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="responded">Respondidos</SelectItem>
                <SelectItem value="not_responded">Não Respondidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

