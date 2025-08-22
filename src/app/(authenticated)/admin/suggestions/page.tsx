"use client"

import { useMemo, useState } from "react"
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

// Usar tipos derivados do tRPC para garantir type safety
type DBSuggestion = RouterOutputs["suggestion"]["list"][number]

type SuggestionLocal = {
  id: string
  ideaNumber: number
  submittedName: string | null
  isNameVisible: boolean
  description: string
  contribution: { type: string; other?: string }
  dateRef: Date | null
  impact: { label: string; score: number } | null
  capacity: { label: string; score: number } | null
  effort: { label: string; score: number } | null
  kpis: string[]
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
    isNameVisible: dbSuggestion.isNameVisible,
    description: dbSuggestion.description,
    contribution: (dbSuggestion.contribution as { type: string; other?: string }) ?? { type: "", other: undefined },
    dateRef: dbSuggestion.dateRef,
    impact: dbSuggestion.impact as { label: string; score: number } | null,
    capacity: dbSuggestion.capacity as { label: string; score: number } | null,
    effort: dbSuggestion.effort as { label: string; score: number } | null,
    kpis: (dbSuggestion.kpis as string[]) ?? [],
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
    status: ["NEW", "IN_REVIEW", "APPROVED", "IN_PROGRESS", "DONE"],
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

  // Buscar classificações do banco (usando defaults estáticos por ora)
  const impactPool: ClassItem[] = [
    { id: '1', label: 'Alto impacto', score: 5 },
    { id: '2', label: 'Médio impacto', score: 3 },
    { id: '3', label: 'Baixo impacto', score: 1 }
  ]
  const capacityPool: ClassItem[] = [
    { id: '1', label: 'Alta capacidade', score: 5 },
    { id: '2', label: 'Média capacidade', score: 3 },
    { id: '3', label: 'Baixa capacidade', score: 1 }
  ]
  const effortPool: ClassItem[] = [
    { id: '1', label: 'Baixo esforço', score: 1 },
    { id: '2', label: 'Médio esforço', score: 3 },
    { id: '3', label: 'Alto esforço', score: 5 }
  ]
  const kpiPool: string[] = []

  const openClassificationModal = (suggestionId: string, type: 'impact' | 'capacity' | 'effort') => {
    setClassificationModal({
      isOpen: true,
      suggestionId,
      type
    })
  }

  const closeClassificationModal = () => {
    setClassificationModal({
      isOpen: false,
      suggestionId: null,
      type: null
    })
  }

  const update = (id: string, updates: Partial<SuggestionLocal>) => {
    const updateData: {
      id: string
      impact?: { label: string; score: number }
      capacity?: { label: string; score: number }
      effort?: { label: string; score: number }
      kpis?: string[]
      status?: "NEW" | "IN_REVIEW" | "APPROVED" | "IN_PROGRESS" | "DONE" | "NOT_IMPLEMENTED"
      rejectionReason?: string
    } = { id }
    
    if (updates.impact) updateData.impact = updates.impact
    if (updates.capacity) updateData.capacity = updates.capacity  
    if (updates.effort) updateData.effort = updates.effort
    if (updates.kpis) updateData.kpis = updates.kpis
    if (updates.status) {
      updateData.status = updates.status
    }
    if (updates.rejectionReason !== undefined) updateData.rejectionReason = updates.rejectionReason ?? undefined

    if (Object.keys(updateData).length > 1) {
      updateMutation.mutate(updateData)
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
      update(draggableId, { status: newStatus })
    }
  }

  const listColumns = useMemo(() => {
    const cols: [SuggestionLocal[], SuggestionLocal[], SuggestionLocal[]] = [[], [], []]
    for (let i = 0; i < suggestions.length; i++) {
      const bucket = (i % 3) as 0 | 1 | 2
      cols[bucket].push(suggestions[i]!)
    }
    return cols
  }, [suggestions])

  return (
    <DashboardShell>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sugestões (Avançado)</h1>
            <p className="text-muted-foreground mt-2">Avalie, classifique e acompanhe o status das sugestões.</p>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/init-classifications', {
                    method: 'POST'
                  })
                  const data = await response.json() as { success?: boolean; message?: string; error?: string }
                  
                  if (data.success) {
                    toast({
                      title: "Classificações inicializadas",
                      description: data.message ?? "Classificações criadas com sucesso"
                    })
                  } else {
                    throw new Error(data.error ?? 'Erro desconhecido')
                  }
                } catch (error) {
                  toast({
                    title: "Erro",
                    description: error instanceof Error ? error.message : "Erro ao inicializar classificações",
                    variant: "destructive"
                  })
                }
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              Inicializar Classificações
            </Button>
          </div>
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
                    {kanbanColumns[st]?.map((s, index) => (
                      <Draggable draggableId={s.id} index={index} key={s.id}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                            <Card className="mb-2 bg-background/80">
                              <CardContent className="p-3">
                                <div className="text-sm font-medium truncate">#{s.ideaNumber} — {s.description.substring(0, 30)}...</div>
                                <div className="text-xs text-muted-foreground">
                                  {s.isNameVisible ? s.submittedName ?? "Não informado" : "Nome oculto"}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
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
          sugestoes={suggestions}
          impactPool={impactPool}
          capacityPool={capacityPool}
          effortPool={effortPool}
          kpiPool={kpiPool}
          update={update}
          currentUser={currentUser ?? undefined}
          onOpenClassificationModal={openClassificationModal}
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
            update={update}
            currentUser={currentUser ?? undefined}
            onOpenClassificationModal={openClassificationModal}
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
  update,
  currentUser,
  onOpenClassificationModal,
}: {
  sugestoes: SuggestionLocal[]
  impactPool: ClassItem[]
  capacityPool: ClassItem[]
  effortPool: ClassItem[]
  kpiPool: string[]
  update: (id: string, updates: Partial<SuggestionLocal>) => void
  currentUser: RouterOutputs["user"]["me"] | undefined
  onOpenClassificationModal: (suggestionId: string, type: 'impact' | 'capacity' | 'effort') => void
}) {
  // Estado local para as justificativas
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  
  const handleRejectionReasonChange = (suggestionId: string, value: string) => {
    setRejectionReasons(prev => ({ ...prev, [suggestionId]: value }))
  }
  
  const saveRejectionReason = (suggestionId: string) => {
    const reason = rejectionReasons[suggestionId]
    if (reason !== undefined) {
      update(suggestionId, { rejectionReason: reason })
      toast({ title: "Justificativa salva", description: "Motivo da não implantação foi salvo." })
    }
  }
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {sugestoes.map((s) => {
        const impactScore = s.impact?.score ?? 0
        const capacityScore = s.capacity?.score ?? 0
        const effortScore = s.effort?.score ?? 0
        const pontuacao = impactScore + capacityScore - effortScore
        const nomeExibicao = s.isNameVisible ? (s.submittedName ?? "Não informado") : "Nome oculto"
        const setorExibido = s.user.setor ?? "Setor não informado"
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
                        <div className="p-2 border rounded text-sm bg-muted">
                          {s.impact?.label ?? "Não classificado"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Capacidade ({capacityScore})</Label>
                        <div className="p-2 border rounded text-sm bg-muted">
                          {s.capacity?.label ?? "Não classificado"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Esforço ({effortScore})</Label>
                        <div className="p-2 border rounded text-sm bg-muted">
                          {s.effort?.label ?? "Não classificado"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium">
                        Pontuação Final: {pontuacao} pontos
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Impacto ({impactScore}) + Capacidade ({capacityScore}) - Esforço ({effortScore}) = {pontuacao}
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
                          if (statusKey) update(s.id, { status: statusKey })
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

                    {pontuacao <= 9 && (
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm">Justificativa para não implantação</label>
                        <Textarea
                          rows={3}
                          value={rejectionReasons[s.id] ?? s.rejectionReason ?? ""}
                          onChange={(e) => handleRejectionReasonChange(s.id, e.target.value)}
                          placeholder="Digite a justificativa para não implementar esta sugestão..."
                        />
                        <Button 
                          size="sm" 
                          onClick={() => saveRejectionReason(s.id)}
                          className="w-fit"
                        >
                          Salvar Justificativa
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => toast({ title: "Avaliação salva", description: `Sugestão #${s.ideaNumber} atualizada.` })}>
                      Salvar avaliação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
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
}) {
  const [newLabel, setNewLabel] = useState("")
  const [newScore, setNewScore] = useState<number>(1)
  const [editingItem, setEditingItem] = useState<ClassItem | null>(null)

  // Mutations para CRUD das classificações
  const createClassification = api.classification.create.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação criada", description: "Nova classificação adicionada com sucesso." })
      // Refetch das classificações será automático devido ao cache do tRPC
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const updateClassification = api.classification.update.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação atualizada", description: "Alterações salvas com sucesso." })
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  const deleteClassification = api.classification.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação removida", description: "Item removido com sucesso." })
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  })

  if (!type || !suggestionId || !currentSuggestion) return null

  const getCurrentPool = () => {
    switch (type) {
      case 'impact': return impactPool
      case 'capacity': return capacityPool
      case 'effort': return effortPool
      default: return []
    }
  }

  const getDBType = () => {
    switch (type) {
      case 'impact': return "IMPACT" as const
      case 'capacity': return "CAPACITY" as const
      case 'effort': return "EFFORT" as const
      default: return "IMPACT" as const
    }
  }

  const getCurrentValue = () => {
    switch (type) {
      case 'impact': return currentSuggestion.impact
      case 'capacity': return currentSuggestion.capacity
      case 'effort': return currentSuggestion.effort
      default: return null
    }
  }

  const getTypeName = () => {
    switch (type) {
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
    setNewScore(1)
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
    setNewScore(1)
  }

  const deleteItem = (itemToDelete: ClassItem) => {
    if (itemToDelete.id) {
      deleteClassification.mutate({
        id: itemToDelete.id
      })
    }
  }

  const selectItem = (item: ClassItem) => {
    const updateData = { [type]: { label: item.label, score: item.score } }
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Classificações - {getTypeName()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seleção de classificação atual */}
          <div>
            <h4 className="text-sm font-medium mb-3">Selecionar classificação para esta sugestão</h4>
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
              {editingItem ? 'Editar item' : 'Adicionar novo item'}
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="label">Descrição</Label>
                <Input
                  id="label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={`Ex: ${type === 'impact' ? 'Alto impacto' : type === 'capacity' ? 'Alta capacidade' : 'Baixo esforço'}`}
                />
              </div>
              <div>
                <Label htmlFor="score">Pontuação</Label>
                <Select value={newScore.toString()} onValueChange={(v) => setNewScore(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a pontuação" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <SelectItem key={score} value={score.toString()}>
                        {score} ponto{score > 1 ? 's' : ''}
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
                        setNewScore(1)
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
