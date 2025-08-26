"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Edit, Trash2, Target, Check, X } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"

interface KpiManagementModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedKpiIds: string[]
  onKpiSelectionChange: (kpiIds: string[]) => void
  suggestionId?: string
}

export function KpiManagementModal({
  isOpen,
  onOpenChange,
  selectedKpiIds,
  onKpiSelectionChange,
  suggestionId
}: KpiManagementModalProps) {
  const utils = api.useUtils()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newKpiName, setNewKpiName] = useState("")
  const [newKpiDescription, setNewKpiDescription] = useState("")
  // Queries
  const kpisQuery = api.kpi.listActive.useQuery()
  const allKpis = useMemo((): { id: string; name: string; description?: string | null; _count?: { suggestions: number } }[] => {
    return Array.isArray(kpisQuery.data) ? kpisQuery.data as { id: string; name: string; description?: string | null; _count?: { suggestions: number } }[] : []
  }, [kpisQuery.data])
  const refetchKpis = kpisQuery.refetch

  const searchQuery_ = api.kpi.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  )
  const searchResults = useMemo((): { id: string; name: string; description?: string | null; _count?: { suggestions: number } }[] => {
    return Array.isArray(searchQuery_.data) ? searchQuery_.data as { id: string; name: string; description?: string | null; _count?: { suggestions: number } }[] : []
  }, [searchQuery_.data])

  // Mutations
  const createKpi = api.kpi.create.useMutation({
    onSuccess: () => {
      toast.success("KPI criado com sucesso!")
      setNewKpiName("")
      setNewKpiDescription("")
      setIsCreatingNew(false)
      // Refresh da lista de KPIs
      void refetchKpis()
      // Invalidar queries relacionadas para garantir que todos os dados sejam atualizados
      void utils.kpi.listActive.invalidate()
      void utils.kpi.search.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateKpi = api.kpi.update.useMutation({
    onSuccess: () => {
      toast.success("KPI atualizado com sucesso!")
      void refetchKpis()
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const deleteKpi = api.kpi.delete.useMutation({
    onSuccess: (_, variables) => {
      toast.success("KPI removido com sucesso!")
      void refetchKpis()
      // Remove da seleção se estiver selecionado
      onKpiSelectionChange(selectedKpiIds.filter(id => id !== variables.id))
      // Invalidar queries relacionadas
      void utils.kpi.listActive.invalidate()
      void utils.kpi.search.invalidate()
      // Invalidar sugestões se houver uma sugestão selecionada
      if (suggestionId) {
        void utils.suggestion.list.invalidate()
        void utils.suggestion.listKanban.invalidate()
      }
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const linkToSuggestion = api.kpi.linkToSuggestion.useMutation({
    onSuccess: () => {
      toast.success("KPIs vinculados com sucesso!")
      // Forçar refetch dos KPIs para a sugestão selecionada
      if (suggestionId) {
        void utils.kpi.getBySuggestionId.invalidate({ suggestionId })
        // Invalidar também a lista de sugestões para mostrar as mudanças imediatamente
        void utils.suggestion.list.invalidate()
        void utils.suggestion.listKanban.invalidate()
      }
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  // Filtrar KPIs baseado na busca
  const filteredKpis = useMemo((): { id: string; name: string; description?: string | null; _count?: { suggestions: number } }[] => {
    if (searchQuery.length === 0) {
      return allKpis
    }
    return searchResults
  }, [allKpis, searchResults, searchQuery])

  const handleCreateKpi = () => {
    if (!newKpiName.trim()) {
      toast.error("Nome do KPI é obrigatório")
      return
    }

    createKpi.mutate({
      name: newKpiName.trim(),
      description: newKpiDescription.trim() || undefined,
    })
  }

  const handleKpiToggle = (kpiId: string) => {
    const isSelected = selectedKpiIds.includes(kpiId)
    let newSelectedIds: string[]

    if (isSelected) {
      newSelectedIds = selectedKpiIds.filter(id => id !== kpiId)
    } else {
      newSelectedIds = [...selectedKpiIds, kpiId]
    }

    onKpiSelectionChange(newSelectedIds)
  }

  const handleSaveSelection = () => {
    console.log('handleSaveSelection called', {
      suggestionId,
      selectedKpiIds,
      hasLinkToSuggestion: !!linkToSuggestion
    })

    if (suggestionId && selectedKpiIds.length > 0) {
      console.log('Calling linkToSuggestion with:', {
        suggestionId,
        kpiIds: selectedKpiIds,
      })

      linkToSuggestion.mutate({
        suggestionId,
        kpiIds: selectedKpiIds,
      })

      // Criar notificações para os KPIs adicionados
      // Nota: A notificação é criada no backend quando os KPIs são vinculados
      // Aqui apenas log para debug
      if (suggestionId && selectedKpiIds.length > 0) {
        console.log('KPIs vinculados à sugestão:', {
          suggestionId,
          kpiIds: selectedKpiIds,
          kpiNames: selectedKpiIds.map(kpiId => {
            const kpi = allKpis.find(k => k.id === kpiId)
            return kpi?.name ?? 'KPI'
          }).join(', ')
        })
      }
    } else {
      console.log('Skipping linkToSuggestion - missing data:', {
        suggestionId: !!suggestionId,
        selectedKpiIdsLength: selectedKpiIds.length
      })
    }
    onOpenChange(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Gerenciar KPIs de Sucesso
          </DialogTitle>
          <DialogDescription>
            Selecione KPIs existentes ou crie novos para acompanhar o sucesso desta sugestão.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Barra de busca e criação */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar KPIs existentes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={isCreatingNew ? "default" : "outline"}
              onClick={() => setIsCreatingNew(!isCreatingNew)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreatingNew ? "Cancelar" : "Novo KPI"}
            </Button>
          </div>

          {/* Formulário de criação */}
          {isCreatingNew && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Criar Novo KPI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kpi-name">Nome do KPI *</Label>
                  <Input
                    id="kpi-name"
                    placeholder="Ex: Aumento de 20% na satisfação dos usuários"
                    value={newKpiName}
                    onChange={(e) => setNewKpiName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kpi-description">Descrição (opcional)</Label>
                  <Textarea
                    id="kpi-description"
                    placeholder="Descreva como este KPI será medido..."
                    value={newKpiDescription}
                    onChange={(e) => setNewKpiDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateKpi}
                    disabled={createKpi.isPending}
                    size="sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {createKpi.isPending ? "Criando..." : "Criar KPI"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewKpiName("")
                      setNewKpiDescription("")
                      setIsCreatingNew(false)
                    }}
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPIs Selecionados */}
          {selectedKpiIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  KPIs Selecionados ({selectedKpiIds.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedKpiIds.map((kpiId: string) => {
                    const kpi = allKpis.find((k: { id: string; name: string; description?: string | null; _count?: { suggestions: number } }) => k.id === kpiId)
                    return kpi ? (
                      <Badge
                        key={kpiId}
                        variant="default"
                        className="flex items-center gap-1"
                      >
                        {kpi.name}
                        <button
                          onClick={() => handleKpiToggle(kpiId)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de KPIs */}
          <div className="flex-1 overflow-hidden">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  KPIs Disponíveis ({filteredKpis.length})
                </CardTitle>
                <CardDescription>
                  Clique em um KPI para selecioná-lo ou desselecioná-lo
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-96">
                {filteredKpis.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Nenhum KPI encontrado para esta busca" : "Nenhum KPI disponível"}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {filteredKpis.map((kpi: { 
                      id: string; 
                      name: string; 
                      description?: string | null; 
                      _count?: { suggestions: number } 
                    }) => {
                      const isSelected = selectedKpiIds.includes(kpi.id)
                      return (
                        <div
                          key={kpi.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleKpiToggle(kpi.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{kpi.name}</h4>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-primary" />
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {kpi._count?.suggestions ?? 0} sugestões
                                </Badge>
                              </div>
                              {kpi.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {kpi.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // TODO: Implementar edição inline
                                  toast.info("Funcionalidade de edição será implementada em breve")
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm(`Tem certeza que deseja remover o KPI "${kpi.name}"?`)) {
                                    deleteKpi.mutate({ id: kpi.id })
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="flex justify-between items-center border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {selectedKpiIds.length} KPI(s) selecionado(s)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSelection}
              disabled={linkToSuggestion.isPending}
            >
              {linkToSuggestion.isPending ? "Salvando..." : "Salvar Seleção"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
