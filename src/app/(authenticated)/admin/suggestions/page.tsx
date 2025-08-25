"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DragDropContext, Droppable, Draggable, type OnDragEndResponder } from "@hello-pangea/dnd"
import { toast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import type { RouterOutputs } from "@/trpc/react"
import { Settings, Plus, Edit, Trash2 } from "lucide-react"
import { KpiManagementModal } from "@/components/admin/suggestion/kpi-management-modal"

// Usar tipos derivados do tRPC para garantir type safety
type DBSuggestion = RouterOutputs["suggestion"]["list"][number]

type SuggestionLocal = {
  id: string
  ideaNumber: number
  submittedName: string | null
  submittedSector: string | null
  isNameVisible: boolean
  description: string
  contribution: { type: string; other?: string }
  dateRef: Date | null
  impact: { label: string; score: number } | null
  capacity: { label: string; score: number } | null
  effort: { label: string; score: number } | null
  kpis: { id: string; name: string; description?: string | null }[]
  kpiIds: string[] // IDs dos KPIs para compatibilidade com o modal
  finalScore: number | null
  finalClassification: { label: string; range: string } | null
  status: "NEW" | "IN_REVIEW" | "APPROVED" | "IN_PROGRESS" | "DONE" | "NOT_IMPLEMENTED"
  rejectionReason: string | null
  user: {
    firstName: string | null
    lastName: string | null
    email: string
    setor: string | null
  }
  analyst: {
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  createdAt: Date
}

type ClassItem = { id?: string; label: string; score: number }

type ClassificationModal = {
  isOpen: boolean
  suggestionId: string | null
  type: 'impact' | 'capacity' | 'effort' | null
}

const STATUS_MAPPING = {
  "NEW": "Novo",
  "IN_REVIEW": "Em avaliação", 
  "APPROVED": "Aprovado",
  "IN_PROGRESS": "Em execução",
  "DONE": "Concluído",
  "NOT_IMPLEMENTED": "Não implantado"
} as const

const STATUS = Object.values(STATUS_MAPPING)

function getStatusColor(status: string): string {
  switch (status) {
    case "Novo":
    case "Em avaliação":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-300/50 dark:text-red-100"
    case "Aprovado":
    case "Em execução":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-300/50 dark:text-yellow-100"
    case "Concluído":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-300/50 dark:text-green-100"
    case "Não implantado":
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/40 dark:text-gray-100"
  }
}

function convertDBToLocal(dbSuggestion: DBSuggestion): SuggestionLocal {
  return {
    id: dbSuggestion.id,
    ideaNumber: dbSuggestion.ideaNumber,
    submittedName: dbSuggestion.submittedName,
    submittedSector: dbSuggestion.user.setor,
    isNameVisible: dbSuggestion.isNameVisible,
    description: dbSuggestion.description,
    contribution: (dbSuggestion.contribution as { type: string; other?: string }) ?? { type: "", other: undefined },
    dateRef: dbSuggestion.dateRef,
    impact: dbSuggestion.impact as { label: string; score: number } | null,
    capacity: dbSuggestion.capacity as { label: string; score: number } | null,
    effort: dbSuggestion.effort as { label: string; score: number } | null,
    kpis: [], // Será carregado via query separada
    kpiIds: [],
    finalScore: dbSuggestion.finalScore,
    finalClassification: dbSuggestion.finalClassification as { label: string; range: string } | null,
    status: dbSuggestion.status,
    rejectionReason: dbSuggestion.rejectionReason,
    user: {
      firstName: dbSuggestion.user.firstName,
      lastName: dbSuggestion.user.lastName,
      email: dbSuggestion.user.email,
      setor: dbSuggestion.user.setor,
    },
    analyst: dbSuggestion.analyst ? {
      firstName: dbSuggestion.analyst.firstName,
      lastName: dbSuggestion.analyst.lastName,
      email: dbSuggestion.analyst.email,
    } : null,
    createdAt: dbSuggestion.createdAt,
  }
}

export default function AdminSuggestionsPage() {
  const { data: dbSuggestions = [], refetch } = api.suggestion.list.useQuery({
    status: ["NEW", "IN_REVIEW", "APPROVED", "IN_PROGRESS", "DONE", "NOT_IMPLEMENTED"],
  })

  const { data: currentUser } = api.user.me.useQuery()

  const suggestions = useMemo(() =>
    dbSuggestions.map((s) => convertDBToLocal(s)),
    [dbSuggestions]
  )

  const updateMutation = api.suggestion.updateAdmin.useMutation({
    onSuccess: () => {
      toast({ title: "Avaliação salva", description: "Sugestão atualizada com sucesso." })
      void refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showManageModal, setShowManageModal] = useState(false)
  const [classificationModal, setClassificationModal] = useState<ClassificationModal>({
    isOpen: false,
    suggestionId: null,
    type: null
  })

  // Estado para filtros
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Estados para o modal de KPIs
  const [kpiModalOpen, setKpiModalOpen] = useState(false)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>([])

  // Função para abrir o modal de KPIs
  const openKpiModal = (suggestionId: string) => {
    console.log('openKpiModal called with suggestionId:', suggestionId)
    setSelectedSuggestionId(suggestionId)
    // Os KPIs serão carregados automaticamente pela query quando selectedSuggestionId mudar
    setKpiModalOpen(true)
  }

  // Query para carregar KPIs da sugestão selecionada
  const kpiQuery = api.kpi.getBySuggestionId.useQuery(
    { suggestionId: selectedSuggestionId ?? "" },
    {
      enabled: !!selectedSuggestionId,
    }
  )
  const kpiData = kpiQuery.data as unknown
  const kpiError = kpiQuery.error
  const isLoadingKpis = kpiQuery.isLoading

  // Memoizar os dados dos KPIs para evitar re-renders desnecessários
  const currentSuggestionKpis = useMemo((): { id: string; name: string; description?: string | null }[] => {
    if (kpiError) {
      console.error('Error loading KPIs:', kpiError)
      return []
    }
    if (Array.isArray(kpiData)) {
      return kpiData as { id: string; name: string; description?: string | null }[]
    }
    return []
  }, [kpiData, kpiError])

  // Atualizar selectedKpiIds quando os dados dos KPIs forem carregados
  useEffect(() => {
    if (currentSuggestionKpis.length > 0) {
      console.log('Frontend: KPIs loaded for suggestion:', selectedSuggestionId, currentSuggestionKpis)
      const kpiIds = currentSuggestionKpis.map(kpi => kpi.id)
      console.log('Frontend: Setting selected KPI IDs:', kpiIds)
      setSelectedKpiIds(kpiIds)
    } else {
      console.log('Frontend: No KPIs data or invalid format')
      setSelectedKpiIds([])
    }
  }, [currentSuggestionKpis, selectedSuggestionId])



  // Buscar classificações do banco dinamicamente
  const { data: impactClassifications, refetch: refetchImpact } = api.classification.listByType.useQuery({ type: "IMPACT" })
  const { data: capacityClassifications, refetch: refetchCapacity } = api.classification.listByType.useQuery({ type: "CAPACITY" })
  const { data: effortClassifications, refetch: refetchEffort } = api.classification.listByType.useQuery({ type: "EFFORT" })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unusedKpiLoading = isLoadingKpis // Silenciar warning do linter
  
  // Função para recarregar todas as classificações
  const refetchAllClassifications = () => {
    void refetchImpact()
    void refetchCapacity()
    void refetchEffort()
  }
  
  // Converter para o formato esperado pelo componente
  const impactPool: ClassItem[] = impactClassifications?.map(c => ({
    id: c.id,
    label: c.label,
    score: c.score
  })) ?? []
  
  const capacityPool: ClassItem[] = capacityClassifications?.map(c => ({
    id: c.id,
    label: c.label,
    score: c.score
  })) ?? []
  
  const effortPool: ClassItem[] = effortClassifications?.map(c => ({
    id: c.id,
    label: c.label,
    score: c.score
  })) ?? []
  
  const kpiPool: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openClassificationModal = (suggestionId: string, type: 'impact' | 'capacity' | 'effort') => {
    setClassificationModal({
      isOpen: true,
      suggestionId,
      type: 'impact' // Sempre abre com impacto como padrão, mas o modal gerencia todas
    })
  }

  const closeClassificationModal = () => {
    setClassificationModal({
      isOpen: false,
      suggestionId: null,
      type: null
    })
  }

  const update = async (id: string, updates: Partial<SuggestionLocal>): Promise<void> => {
    const updateData: {
      id: string
      impact?: { label: string; score: number }
      capacity?: { label: string; score: number }
      effort?: { label: string; score: number }
      kpiIds?: string[]
      status?: "NEW" | "IN_REVIEW" | "APPROVED" | "IN_PROGRESS" | "DONE" | "NOT_IMPLEMENTED"
      rejectionReason?: string
    } = { id }

    if (updates.impact) updateData.impact = updates.impact
    if (updates.capacity) updateData.capacity = updates.capacity
    if (updates.effort) updateData.effort = updates.effort
    if (updates.kpiIds) updateData.kpiIds = updates.kpiIds
    if (updates.status) {
      updateData.status = updates.status
    }
    if (updates.rejectionReason !== undefined) {
      updateData.rejectionReason = updates.rejectionReason ?? undefined
    }

    if (Object.keys(updateData).length > 1) {
      await updateMutation.mutateAsync(updateData)
    }
  }

  const kanbanColumns = useMemo(() => {
    const map: Record<string, SuggestionLocal[]> = {}
    STATUS.forEach((s) => (map[s] = []))
    for (const s of suggestions) {
      const statusLabel = STATUS_MAPPING[s.status] ?? s.status
      ;(map[statusLabel] ?? (map[statusLabel] = [])).push(s)
    }
    return map
  }, [suggestions])

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, draggableId } = result
    if (!destination) return
    const newStatusLabel = destination.droppableId
    const newStatus = Object.entries(STATUS_MAPPING).find(([_, label]) => label === newStatusLabel)?.[0] as keyof typeof STATUS_MAPPING
    if (newStatus) {
      update(draggableId, { status: newStatus }).catch(console.error)
    }
  }

  // Função para determinar status baseado na pontuação
  const getStatusFromScore: (suggestion: SuggestionLocal) => string = (suggestion) => {
    const impactScore = suggestion.impact?.score ?? 0
    const capacityScore = suggestion.capacity?.score ?? 0
    const effortScore = suggestion.effort?.score ?? 0
    const pontuacao = impactScore + capacityScore - effortScore

    if (pontuacao >= 0 && pontuacao <= 9) return "Descartar"
    if (pontuacao >= 10 && pontuacao <= 14) return "Ajustar"
    if (pontuacao >= 15 && pontuacao <= 20) return "Aprovar"
    if (pontuacao > 20) return "Prioritário"
    return "Revisar"
  }

  // Ordenação inteligente das sugestões com filtro
  const sortedSuggestions = useMemo(() => {
    const priorityOrder = {
      "Novo": 1,
      "Em avaliação": 2,
      "Aprovado": 3,
      "Em execução": 4,
      "Ajustes e incubar": 5,
      "Não implantado": 6,
      "Concluído": 7
    }

    let filteredSuggestions = suggestions

    // Aplicar filtro de status se não for "all"
    if (statusFilter !== "all") {
      filteredSuggestions = suggestions.filter(s => {
        if (statusFilter === "score-based") {
          // Filtrar por recomendação baseada na pontuação
          const scoreStatus = getStatusFromScore(s)
          return scoreStatus === "Descartar" || scoreStatus === "Ajustar" || scoreStatus === "Aprovar"
        }
        return (STATUS_MAPPING[s.status] ?? s.status) === statusFilter
      })
    }

    return [...filteredSuggestions].sort((a, b) => {
      // Primeiro por prioridade de status
      const statusA = STATUS_MAPPING[a.status] ?? a.status
      const statusB = STATUS_MAPPING[b.status] ?? b.status
      const priorityA = priorityOrder[statusA as keyof typeof priorityOrder] ?? 999
      const priorityB = priorityOrder[statusB as keyof typeof priorityOrder] ?? 999

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      // Depois por data (mais recentes primeiro)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [suggestions, statusFilter])

  const listColumns = useMemo(() => {
    const cols: [SuggestionLocal[], SuggestionLocal[], SuggestionLocal[]] = [[], [], []]
    for (let i = 0; i < sortedSuggestions.length; i++) {
      const bucket = (i % 3) as 0 | 1 | 2
      cols[bucket].push(sortedSuggestions[i]!)
    }
    return cols
  }, [sortedSuggestions])

  return (
    <DashboardShell>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sugestões (Avançado)</h1>
            <p className="text-muted-foreground mt-2">Avalie, classifique e acompanhe o status das sugestões.</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Filtros</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                Todas ({suggestions.length})
              </Button>
              <Button
                variant={statusFilter === "score-based" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("score-based")}
              >
                Por Pontuação
              </Button>
              {STATUS.map((st) => (
                <Button
                  key={st}
                  variant={statusFilter === st ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(st)}
                >
                  {st} ({kanbanColumns[st]?.length ?? 0})
                </Button>
              ))}
            </div>
          </div>
          {statusFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Limpar Filtro
            </Button>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Visão Kanban</h2>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {STATUS.map((st) => (
              <Droppable droppableId={st} key={st}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-lg border p-3 ${getStatusColor(st)}`}
                  >
                                         <div className="font-medium mb-2">
                       {st} ({kanbanColumns[st]?.length ?? 0})
                     </div>
                                           <div className="max-h-80 overflow-y-auto space-y-2 scrollbar-hide">
                                             {kanbanColumns[st]?.map((s, index) => {
                        const impactScore = s.impact?.score ?? 0
                        const capacityScore = s.capacity?.score ?? 0
                        const effortScore = s.effort?.score ?? 0
                        const pontuacao = impactScore + capacityScore - effortScore

                        const getRecommendationColor = (score: number) => {
                          if (score >= 0 && score <= 9) return 'bg-red-100 text-red-700 border border-red-200'
                          if (score >= 10 && score <= 14) return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          if (score >= 15 && score <= 20) return 'bg-green-100 text-green-700 border border-green-200'
                          if (score > 20) return 'bg-blue-100 text-blue-700 border border-blue-200'
                          return 'bg-gray-100 text-gray-700 border border-gray-200'
                        }

                        const getRecommendationText = (score: number) => {
                          if (score >= 0 && score <= 9) return 'Descartar'
                          if (score >= 10 && score <= 14) return 'Ajustar'
                          if (score >= 15 && score <= 20) return 'Aprovar'
                          if (score > 20) return 'Prioritário'
                          return 'Revisar'
                        }

                        return (
                          <Draggable draggableId={s.id} index={index} key={s.id}>
                            {(prov) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                <Card className="bg-background/80">
                                  <CardContent className="p-3">
                                    <div className="text-sm font-medium truncate">#{s.ideaNumber} — {s.description.substring(0, 30)}...</div>
                                    <div className="text-xs text-muted-foreground mb-2">
                                      {s.isNameVisible ? s.submittedName ?? "Não informado" : "Nome oculto"}
                                    </div>
                                    {/* Pontuação e recomendação no Kanban */}
                                    <div className="flex items-center justify-between">
                                      <div className="text-xs font-medium">
                                        Pontuação: {pontuacao}
                                      </div>
                                      <div className={`text-xs px-2 py-1 rounded-md font-medium ${getRecommendationColor(pontuacao)}`}>
                                        {getRecommendationText(pontuacao)}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                     </div>
                     {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      <div className="md:hidden">
        <IdeasAccordion
          sugestoes={sortedSuggestions}
          impactPool={impactPool}
          capacityPool={capacityPool}
          effortPool={effortPool}
          kpiPool={kpiPool}
          currentSuggestionKpis={currentSuggestionKpis}
          update={update}
          currentUser={currentUser}
          onOpenClassificationModal={openClassificationModal}
          onOpenKpiModal={openKpiModal}
          getStatusFromScore={getStatusFromScore}
        />
      </div>

      <div className="hidden md:grid grid-cols-3 gap-3">
        {listColumns.map((col, idx) => (
          <IdeasAccordion
            key={`col-${idx}`}
            sugestoes={col}
            impactPool={impactPool}
            capacityPool={capacityPool}
            effortPool={effortPool}
            kpiPool={kpiPool}
            currentSuggestionKpis={currentSuggestionKpis}
            update={update}
            currentUser={currentUser}
            onOpenClassificationModal={openClassificationModal}
            onOpenKpiModal={openKpiModal}
            getStatusFromScore={getStatusFromScore}
          />
        ))}
      </div>

      {/* Modal de Classificações */}
      <ClassificationManagementModal
        isOpen={classificationModal.isOpen}
        onClose={closeClassificationModal}
        suggestionId={classificationModal.suggestionId}
        type={classificationModal.type}
        impactPool={impactPool}
        capacityPool={capacityPool}
        effortPool={effortPool}
        currentSuggestion={suggestions.find(s => s.id === classificationModal.suggestionId)}
        update={update}
        onClassificationsChange={refetchAllClassifications}
      />

      {/* Modal de Gerenciamento de KPIs */}
      <KpiManagementModal
        isOpen={kpiModalOpen}
        onOpenChange={(open) => {
          setKpiModalOpen(open)
          if (!open) {
            // Recarregar dados da sugestão quando o modal for fechado
            if (selectedSuggestionId) {
              console.log('Modal closed, reloading suggestion data...')
              void refetch()
            }
            setSelectedSuggestionId(null)
            setSelectedKpiIds([])
          }
        }}
        selectedKpiIds={selectedKpiIds}
        onKpiSelectionChange={setSelectedKpiIds}
        suggestionId={selectedSuggestionId ?? undefined}
      />
    </DashboardShell>
  )
}

function IdeasAccordion({
  sugestoes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  impactPool,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  capacityPool,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  effortPool,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  kpiPool,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentSuggestionKpis,
  update,
  currentUser,
  onOpenClassificationModal,
  onOpenKpiModal,
  getStatusFromScore,
}: {
  sugestoes: SuggestionLocal[]
  impactPool: ClassItem[]
  capacityPool: ClassItem[]
  effortPool: ClassItem[]
  kpiPool: string[]
  currentSuggestionKpis: { id: string; name: string; description?: string | null }[]
  update: (id: string, updates: Partial<SuggestionLocal>) => void
  currentUser: RouterOutputs["user"]["me"] | undefined
  onOpenClassificationModal: (suggestionId: string, type: 'impact' | 'capacity' | 'effort') => void
  onOpenKpiModal: (suggestionId: string) => void
  getStatusFromScore: (suggestion: SuggestionLocal) => string
}) {
  // Estado local para as justificativas
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  
  const handleRejectionReasonChange = (suggestionId: string, value: string) => {
    setRejectionReasons(prev => ({ ...prev, [suggestionId]: value }))
  }
  
  // Mutation para enviar notificação de rejeição
  const sendRejectionNotification = api.suggestion.sendRejectionNotification.useMutation({
    onSuccess: () => {
      toast({
        title: "Notificação enviada",
        description: "Email de notificação foi enviado para o colaborador."
      })
    },
    onError: (error) => {
      toast({
        title: "Erro na notificação",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const saveRejectionReason = async (suggestionId: string) => {
    const reason = rejectionReasons[suggestionId]

    if (reason?.trim()) {
      try {

        update(suggestionId, {
          status: "NOT_IMPLEMENTED",
          rejectionReason: reason.trim()
        })

        await new Promise(resolve => setTimeout(resolve, 500))

        await sendRejectionNotification.mutateAsync({
          suggestionId,
          rejectionReason: reason.trim()
        })


        toast({
          title: "Sugestão rejeitada e notificação enviada",
          description: "Status alterado para 'Não implementado', motivo salvo e colaborador notificado!"
        })
      } catch {
        toast({
          title: "Erro",
          description: "Erro ao processar rejeição. Tente novamente.",
          variant: "destructive"
        })
      }
    } else {
      toast({
        title: "Erro",
        description: "Digite uma justificativa antes de salvar.",
        variant: "destructive"
      })
    }
  }
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {sugestoes.map((s) => (
        <SuggestionItem
          key={s.id}
          suggestion={s}
          rejectionReasons={rejectionReasons}
          handleRejectionReasonChange={handleRejectionReasonChange}
          saveRejectionReason={saveRejectionReason}
          sendRejectionNotification={sendRejectionNotification}
          update={update}
          currentUser={currentUser}
          onOpenClassificationModal={onOpenClassificationModal}
          onOpenKpiModal={onOpenKpiModal}
          getStatusFromScore={getStatusFromScore}
        />
      ))}
    </Accordion>
  )
}

function SuggestionItem({
  suggestion: s,
  rejectionReasons,
  handleRejectionReasonChange,
  saveRejectionReason,
  sendRejectionNotification,
  update,
  currentUser,
  onOpenClassificationModal,
  onOpenKpiModal,
  getStatusFromScore,
}: {
  suggestion: SuggestionLocal
  rejectionReasons: Record<string, string>
  handleRejectionReasonChange: (suggestionId: string, value: string) => void
  saveRejectionReason: (suggestionId: string) => Promise<void>
  sendRejectionNotification: ReturnType<typeof api.suggestion.sendRejectionNotification.useMutation>
  update: (id: string, updates: Partial<SuggestionLocal>) => void
  currentUser: RouterOutputs["user"]["me"] | undefined
  onOpenClassificationModal: (suggestionId: string, type: 'impact' | 'capacity' | 'effort') => void
  onOpenKpiModal: (suggestionId: string) => void
  getStatusFromScore: (suggestion: SuggestionLocal) => string
}) {
  // Carregar KPIs específicos para esta sugestão
  const { data: suggestionKpis = [] } = api.kpi.getBySuggestionId.useQuery(
    { suggestionId: s.id },
    { enabled: true }
  )

  const impactScore = s.impact?.score ?? 0
  const capacityScore = s.capacity?.score ?? 0
  const effortScore = s.effort?.score ?? 0
  const pontuacao = impactScore + capacityScore - effortScore
  const nomeExibicao = s.isNameVisible ? (s.submittedName ?? "Não informado") : "Nome oculto"
  const setorExibido = s.submittedSector ?? s.user.setor ?? "Setor não informado"
  const contribType = s.contribution?.type ?? ""
  const contribOther = s.contribution?.other

  return (
          <AccordionItem key={s.id} value={s.id} className="border rounded-lg">
            <AccordionTrigger className="px-4">
              <div className="w-full">
                <div className="flex flex-col gap-2">
                  <div className="font-semibold">
                    #{s.ideaNumber} — {s.description.substring(0, 60)}...
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      Nome: {nomeExibicao}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{setorExibido}</Badge>
                      {/* Tag de status baseada na pontuação */}
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          getStatusFromScore(s) === 'Descartar' ? 'border-red-300 text-red-700 bg-red-50' :
                          getStatusFromScore(s) === 'Ajustar' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                          getStatusFromScore(s) === 'Aprovar' ? 'border-green-300 text-green-700 bg-green-50' :
                          getStatusFromScore(s) === 'Prioritário' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                          'border-gray-300 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {getStatusFromScore(s)}
                      </Badge>
                      {/* Tag de status atual */}
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(STATUS_MAPPING[s.status] ?? s.status)}`}
                      >
                        {STATUS_MAPPING[s.status] ?? s.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-medium">Data</div>
                      <div className="text-sm text-muted-foreground">
                        {s.dateRef ? new Date(s.dateRef).toLocaleDateString('pt-BR') : 
                         new Date(s.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Setor</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{setorExibido}</Badge>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium">Tipo de contribuição</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {contribType === "IDEIA_INOVADORA" ? "Ideia inovadora" :
                           contribType === "SUGESTAO_MELHORIA" ? "Sugestão de melhoria" :
                           contribType === "SOLUCAO_PROBLEMA" ? "Solução de problema" :
                           contribType === "OUTRO" ? `Outro: ${contribOther ?? ""}` : "-"}
                        </Badge>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium">Descrição</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {s.description}
                      </div>
                    </div>
                  </div>

                  {/* Seção de Classificações */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Classificações</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onOpenClassificationModal(s.id, 'impact')}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Gerenciar Classificações
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm">Impacto ({impactScore})</Label>
                        <div 
                          className="p-2 border rounded text-sm bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => onOpenClassificationModal(s.id, 'impact')}
                        >
                          {s.impact?.label ?? "Clique para classificar"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Capacidade ({capacityScore})</Label>
                        <div 
                          className="p-2 border rounded text-sm bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => onOpenClassificationModal(s.id, 'capacity')}
                        >
                          {s.capacity?.label ?? "Clique para classificar"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Esforço ({effortScore})</Label>
                        <div 
                          className="p-2 border rounded text-sm bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => onOpenClassificationModal(s.id, 'effort')}
                        >
                          {s.effort?.label ?? "Clique para classificar"}
                        </div>
                      </div>
                    </div>

                    {/* KPIs de Sucesso */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">KPIs de Sucesso</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenKpiModal(s.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Gerenciar KPIs
                        </Button>
                      </div>

                      {suggestionKpis && suggestionKpis.length > 0 ? (
                        <div className="space-y-2">
                          {suggestionKpis.map((kpi) => (
                            <div key={kpi.id} className="flex items-start justify-between p-3 bg-muted/50 rounded border">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{kpi.name}</div>
                                {kpi.description && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {kpi.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded text-center">
                          Nenhum KPI definido. Clique em &quot;Gerenciar KPIs&quot; para incluir métricas de sucesso.
                        </div>
                      )}


                    </div>

                    {/* Pontuação Final e Recomendação */}
                    <div className="p-3 rounded-lg border">
                      <div className="text-sm font-medium mb-2">
                        Pontuação Final: {pontuacao} pontos
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Impacto ({impactScore}) + Capacidade ({capacityScore}) - Esforço ({effortScore}) = {pontuacao}
                      </div>

                      {/* Recomendação baseada na pontuação */}
                      <div className={`p-2 rounded-md text-xs font-medium ${
                        pontuacao >= 0 && pontuacao <= 9
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : pontuacao >= 10 && pontuacao <= 14
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : pontuacao >= 15 && pontuacao <= 20
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {pontuacao >= 0 && pontuacao <= 9 && "🔴 Descarta com justificativa clara"}
                        {pontuacao >= 10 && pontuacao <= 14 && "🟡 Ajustes e incubar"}
                        {pontuacao >= 15 && pontuacao <= 20 && "🟢 Aprovar para gestores"}
                        {pontuacao > 20 && "🚀 Aprovação imediata"}
                        {pontuacao < 0 && "❌ Revisar pontuação"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm">Status</label>
                      <Select
                        value={STATUS_MAPPING[s.status]}
                        onValueChange={(v) => {
                          const statusKey = Object.entries(STATUS_MAPPING).find(([_, label]) => label === v)?.[0] as keyof typeof STATUS_MAPPING
                          if (statusKey) {
                            if (statusKey !== s.status) {
                              update(s.id, { status: statusKey })
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm">Responsável pela devolutiva</label>
                      <Input 
                        value={
                          currentUser && 'firstName' in currentUser && 'lastName' in currentUser && currentUser.firstName && currentUser.lastName
                            ? `${currentUser.firstName} ${currentUser.lastName}`
                            : currentUser && 'email' in currentUser 
                              ? currentUser.email 
                              : "Admin Atual"
                        }
                        readOnly 
                      />
                    </div>

                    {/* Mostrar campo de motivo sempre que o status for "NOT_IMPLEMENTED" */}
                    {s.status === "NOT_IMPLEMENTED" && (
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-red-700">
                          Motivo da não implementação <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          rows={4}
                          value={rejectionReasons[s.id] ?? s.rejectionReason ?? ""}
                          onChange={(e) => handleRejectionReasonChange(s.id, e.target.value)}
                          placeholder="Digite o motivo detalhado da não implementação desta sugestão..."
                          className="border-red-200 focus:border-red-300"
                          required
                        />
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-red-600">
                            Campo obrigatório para sugestões não implementadas
                          </div>
                                                    <Button
                            size="sm"
                            onClick={() => saveRejectionReason(s.id)}
                            className="w-fit bg-red-600 hover:bg-red-700"
                            disabled={
                              s.status !== "NOT_IMPLEMENTED" ||
                              sendRejectionNotification.isPending ||
                              (!rejectionReasons[s.id]?.trim() && !s.rejectionReason?.trim())
                            }
                          >
                            {sendRejectionNotification.isPending ? "Enviando..." : "Salvar Motivo"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        // Validação: se status for "NOT_IMPLEMENTED", verificar justificativa
                        if (s.status === "NOT_IMPLEMENTED" && !s.rejectionReason && !rejectionReasons[s.id]?.trim()) {
                          toast({
                            title: "Justificativa obrigatória",
                            description: "Use o botão 'Salvar Motivo' para fornecer a justificativa e enviar a notificação.",
                            variant: "destructive"
                          })
                          return
                        }
                        toast({ title: "Avaliação salva", description: `Sugestão #${s.ideaNumber} atualizada.` })
                      }}
                      disabled={
                        s.status === "NOT_IMPLEMENTED" &&
                        !s.rejectionReason &&
                        !rejectionReasons[s.id]?.trim()
                      }
                    >
                      Salvar avaliação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
  )
}

function ClassificationManagementModal({
  isOpen,
  onClose,
  suggestionId,
  type,
  impactPool,
  capacityPool,
  effortPool,
  currentSuggestion,
  update,
  onClassificationsChange,
}: {
  isOpen: boolean
  onClose: () => void
  suggestionId: string | null
  type: 'impact' | 'capacity' | 'effort' | null
  impactPool: ClassItem[]
  capacityPool: ClassItem[]
  effortPool: ClassItem[]
  currentSuggestion: SuggestionLocal | undefined
  update: (id: string, updates: Partial<SuggestionLocal>) => void
  onClassificationsChange: () => void
}) {
  const [newLabel, setNewLabel] = useState("")
  const [newScore, setNewScore] = useState<number>(0)
  const [editingItem, setEditingItem] = useState<ClassItem | null>(null)
  const [activeTab, setActiveTab] = useState<'impact' | 'capacity' | 'effort'>('impact')

  // Inicializar activeTab baseado no tipo passado
  useEffect(() => {
    if (type) {
      setActiveTab(type)
    }
  }, [type])

  // Mutations para CRUD das classificações
  const createClassification = api.classification.create.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação criada", description: "Nova classificação adicionada com sucesso." })
      // Recarregar classificações para atualizar a interface
      onClassificationsChange()
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const updateClassification = api.classification.update.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação atualizada", description: "Alterações salvas com sucesso." })
      // Recarregar classificações para atualizar a interface
      onClassificationsChange()
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const deleteClassification = api.classification.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação removida", description: "Item removido com sucesso." })
      // Recarregar classificações para atualizar a interface
      onClassificationsChange()
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  if (!suggestionId || !currentSuggestion) return null

  const getCurrentPool = () => {
    switch (activeTab) {
      case 'impact': return impactPool
      case 'capacity': return capacityPool
      case 'effort': return effortPool
      default: return []
    }
  }

  const getDBType = () => {
    switch (activeTab) {
      case 'impact': return "IMPACT" as const
      case 'capacity': return "CAPACITY" as const
      case 'effort': return "EFFORT" as const
      default: return "IMPACT" as const
    }
  }

  const getCurrentValue = () => {
    switch (activeTab) {
      case 'impact': return currentSuggestion.impact
      case 'capacity': return currentSuggestion.capacity
      case 'effort': return currentSuggestion.effort
      default: return null
    }
  }

  const getTypeName = () => {
    switch (activeTab) {
      case 'impact': return 'Impacto'
      case 'capacity': return 'Capacidade'
      case 'effort': return 'Esforço'
      default: return ''
    }
  }

  const addNewItem = () => {
    if (!newLabel.trim()) return
    
    createClassification.mutate({
      label: newLabel.trim(),
      score: newScore,
      type: getDBType()
    })
    
    setNewLabel("")
    setNewScore(0)
  }

  const editItem = (item: ClassItem) => {
    setEditingItem(item)
    setNewLabel(item.label)
    setNewScore(item.score)
  }

  const saveEdit = () => {
    if (!editingItem || !newLabel.trim()) return
    
    if (editingItem?.id) {
      updateClassification.mutate({
        id: editingItem.id,
        label: newLabel.trim(),
        score: newScore
      })
    }
    
    setEditingItem(null)
    setNewLabel("")
    setNewScore(0)
  }

  const deleteItem = (itemToDelete: ClassItem) => {
    if (itemToDelete.id) {
      deleteClassification.mutate({
        id: itemToDelete.id
      })
    }
  }

  const selectItem = (item: ClassItem) => {
    const updateData = { [activeTab]: { label: item.label, score: item.score } }
    update(suggestionId, updateData as Partial<SuggestionLocal>)
    onClose()
    
    toast({ 
      title: "Classificação aplicada", 
      description: `${item.label} (${item.score} pontos) foi aplicado para ${getTypeName().toLowerCase()}.` 
    })
  }

  const currentPool = getCurrentPool()
  const currentValue = getCurrentValue()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Classificações</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Abas para os tipos de classificação */}
          <div className="flex space-x-1 border-b">
            {(['impact', 'capacity', 'effort'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab === 'impact' ? 'Impacto' : tab === 'capacity' ? 'Capacidade' : 'Esforço'}
              </button>
            ))}
          </div>

          {/* Seleção de classificação atual */}
          <div>
            <h4 className="text-sm font-medium mb-3">
              Selecionar classificação para {getTypeName().toLowerCase()} - {currentSuggestion.ideaNumber}
            </h4>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {currentPool.map((item) => (
                <div 
                  key={item.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                    currentValue?.label === item.label ? 'border-primary bg-primary/10' : ''
                  }`}
                  onClick={() => selectItem(item)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.score} pontos</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          editItem(item)
                        }}
                        disabled={editingItem?.id === item.id}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteItem(item)
                        }}
                        disabled={deleteClassification.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adicionar/Editar novo item */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">
              {editingItem ? 'Editar item' : `Adicionar novo item para ${getTypeName().toLowerCase()}`}
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="label">Descrição</Label>
                <Input
                  id="label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={`Ex: ${activeTab === 'impact' ? 'Alto impacto' : activeTab === 'capacity' ? 'Alta capacidade' : 'Baixo esforço'}`}
                />
              </div>
                             <div>
                 <Label htmlFor="score">Pontuação</Label>
                 <Select value={newScore.toString()} onValueChange={(v) => setNewScore(parseInt(v))}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione a pontuação" />
                   </SelectTrigger>
                   <SelectContent>
                     {Array.from({ length: 21 }, (_, i) => i).map((score) => (
                       <SelectItem key={score} value={score.toString()}>
                         {score} ponto{score !== 1 ? 's' : ''}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
              <div className="flex gap-2">
                {editingItem ? (
                  <>
                    <Button 
                      onClick={saveEdit} 
                      disabled={!newLabel.trim() || updateClassification.isPending}
                    >
                      {updateClassification.isPending ? "Salvando..." : "Salvar alterações"}
                    </Button>
                    <Button 
                      variant="outline" 
                                             onClick={() => {
                         setEditingItem(null)
                         setNewLabel("")
                         setNewScore(0)
                       }}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={addNewItem} 
                    disabled={!newLabel.trim() || createClassification.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createClassification.isPending ? "Adicionando..." : "Adicionar item"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


