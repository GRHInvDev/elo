"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { DashboardShell } from "@/components/dashboard-shell"
import { MultiSelect } from "@/components/forms/multi-select"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DragDropContext, Droppable, Draggable, type OnDragEndResponder } from "@hello-pangea/dnd"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"

type DBSuggestion = {
  id: string
  ideaNumber: number
  submittedName: string | null
  description: string
  contribution: { type: string; other?: string } | null
  sector: string[] | null
  dateRef: Date | null
  impact: { label: string; score: number } | null
  capacity: { label: string; score: number } | null
  effort: { label: string; score: number } | null
  kpis: string[] | null
  finalScore: number | null
  finalClassification: { label: string; range: string } | null
  status: "NEW" | "IN_REVIEW" | "APPROVED" | "IN_PROGRESS" | "DONE" | "NOT_IMPLEMENTED"
  rejectionReason: string | null
  user: {
    firstName: string | null
    lastName: string | null
    email: string
  }
  analyst: {
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  createdAt: Date
  updatedAt: Date
}

type SuggestionLocal = {
	id: string
  ideaNumber: number
  submittedName: string | null
  description: string
  contribution: { type: string; other?: string }
  sector: string[]
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
  }
  analyst: {
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  createdAt: Date
}

type ClassItem = { id?: string; label: string; score: number }

const STATUS_MAPPING = {
  "NEW": "Novo",
  "IN_REVIEW": "Em avaliação", 
  "APPROVED": "Aprovado",
  "IN_PROGRESS": "Em execução",
  "DONE": "Concluído",
  "NOT_IMPLEMENTED": "Não implantado"
} as const

const STATUS = Object.values(STATUS_MAPPING)

function getFinalClassificationLabel(pontuacao: number): string {
  if (pontuacao >= 15 && pontuacao <= 20) return "Aprovar para Gestores (15 a 20)"
  if (pontuacao >= 10 && pontuacao <= 14) return "Ajustar e incubar (10 a 14)"
  return "Descartar com justificativa clara (0 a 9)"
}

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
    description: dbSuggestion.description,
    contribution: dbSuggestion.contribution ?? { type: "", other: undefined },
    sector: dbSuggestion.sector ?? [],
    dateRef: dbSuggestion.dateRef,
    impact: dbSuggestion.impact,
    capacity: dbSuggestion.capacity,
    effort: dbSuggestion.effort,
    kpis: dbSuggestion.kpis ?? [],
    finalScore: dbSuggestion.finalScore,
    finalClassification: dbSuggestion.finalClassification,
    status: dbSuggestion.status,
    rejectionReason: dbSuggestion.rejectionReason,
    user: dbSuggestion.user,
    analyst: dbSuggestion.analyst,
    createdAt: dbSuggestion.createdAt,
  }
}

export default function AdminSuggestionsPage() {
  const { data: dbSuggestions = [], refetch } = api.suggestion.list.useQuery({
    status: ["NEW", "IN_REVIEW", "APPROVED", "IN_PROGRESS", "DONE"],
  })

  const { data: currentUser } = api.user.me.useQuery()

  // Queries para buscar dados do banco
  const { data: impactClassifications = [] } = api.classification.list.useQuery({ type: "IMPACT" })
  const { data: capacityClassifications = [] } = api.classification.list.useQuery({ type: "CAPACITY" })
  const { data: effortClassifications = [] } = api.classification.list.useQuery({ type: "EFFORT" })
  const { data: kpis = [] } = api.kpi.list.useQuery()

  // Mutations para gerenciar classificações
  const createClassificationMutation = api.classification.create.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação criada", description: "Nova classificação adicionada com sucesso." })
      void api.useUtils().classification.list.invalidate()
    }
  })

  const updateClassificationMutation = api.classification.update.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação atualizada", description: "Classificação atualizada com sucesso." })
      void api.useUtils().classification.list.invalidate()
    }
  })

  const deleteClassificationMutation = api.classification.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Classificação removida", description: "Classificação removida com sucesso." })
      void api.useUtils().classification.list.invalidate()
    }
  })

  const createKpiMutation = api.kpi.create.useMutation({
    onSuccess: () => {
      toast({ title: "KPI criado", description: "Novo KPI adicionado com sucesso." })
      void api.useUtils().kpi.list.invalidate()
    }
  })

  const deleteKpiMutation = api.kpi.delete.useMutation({
    onSuccess: () => {
      toast({ title: "KPI removido", description: "KPI removido com sucesso." })
      void api.useUtils().kpi.list.invalidate()
    }
  })

  const suggestions = useMemo(() => 
    dbSuggestions.map(s => convertDBToLocal(s as DBSuggestion)), 
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

  const [showManageModal, setShowManageModal] = useState(false)

  // Converter dados do banco para formato local
  const impactPool: ClassItem[] = impactClassifications.map(c => ({ id: c.id, label: c.label, score: c.score }))
  const capacityPool: ClassItem[] = capacityClassifications.map(c => ({ id: c.id, label: c.label, score: c.score }))
  const effortPool: ClassItem[] = effortClassifications.map(c => ({ id: c.id, label: c.label, score: c.score }))
  const kpiPool: string[] = kpis.map(k => k.name)

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

  const onAddKpi = (value: string) => {
    const v = value.trim()
    if (v.length > 0 && !kpiPool.includes(v)) {
      createKpiMutation.mutate({ name: v })
    }
  }

  const addImpactItem = (label: string, score: number) => {
    if (!label || Number.isNaN(score)) return
    createClassificationMutation.mutate({ label, score, type: "IMPACT" })
  }

  const addCapacityItem = (label: string, score: number) => {
    if (!label || Number.isNaN(score)) return
    createClassificationMutation.mutate({ label, score, type: "CAPACITY" })
  }

  const addEffortItem = (label: string, score: number) => {
    if (!label || Number.isNaN(score)) return
    createClassificationMutation.mutate({ label, score, type: "EFFORT" })
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
          <Button 
            onClick={() => setShowManageModal(true)} 
            variant="outline"
            className="whitespace-nowrap"
          >
            Gerenciar Classificações
          </Button>
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
                                  {s.submittedName ?? "Não informado"}
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
          onAddKpi={onAddKpi}
          addImpactItem={addImpactItem}
          addCapacityItem={addCapacityItem}
          addEffortItem={addEffortItem}
          update={update}
          currentUser={currentUser}
          setShowManageModal={setShowManageModal}
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
            onAddKpi={onAddKpi}
            addImpactItem={addImpactItem}
            addCapacityItem={addCapacityItem}
            addEffortItem={addEffortItem}
            update={update}
            currentUser={currentUser}
            setShowManageModal={setShowManageModal}
          />
        ))}
      </div>

      {/* Modal de Gerenciamento de Classificações */}
      <ManageClassificationsModal 
        open={showManageModal}
        onOpenChange={setShowManageModal}
        impactPool={impactPool}
        capacityPool={capacityPool}
        effortPool={effortPool}
        onCreateClassification={createClassificationMutation.mutate}
        onUpdateClassification={updateClassificationMutation.mutate}
        onDeleteClassification={deleteClassificationMutation.mutate}
        kpiPool={kpiPool}
        onCreateKpi={createKpiMutation.mutate}
        onDeleteKpi={deleteKpiMutation.mutate}
      />
    </DashboardShell>
  )
}

function IdeasAccordion({
  sugestoes,
  impactPool,
  capacityPool,
  effortPool,
  kpiPool,
  onAddKpi,
  addImpactItem: _addImpactItem,
  addCapacityItem: _addCapacityItem,
  addEffortItem: _addEffortItem,
  update,
  currentUser,
  setShowManageModal,
}: {
  sugestoes: SuggestionLocal[]
  impactPool: ClassItem[]
  capacityPool: ClassItem[]
  effortPool: ClassItem[]
  kpiPool: string[]
  onAddKpi: (v: string) => void
  addImpactItem: (label: string, score: number) => void
  addCapacityItem: (label: string, score: number) => void
  addEffortItem: (label: string, score: number) => void
  update: (id: string, updates: Partial<SuggestionLocal>) => void
  currentUser: ReturnType<typeof api.user.me.useQuery>['data']
  setShowManageModal: (show: boolean) => void
}) {
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
				{sugestoes.map((s) => {
        const impactScore = s.impact?.score ?? 0
        const capacityScore = s.capacity?.score ?? 0
        const effortScore = s.effort?.score ?? 0
        const pontuacao = impactScore + capacityScore - effortScore
        const finalClass = getFinalClassificationLabel(pontuacao)
        const nomeExibicao = s.submittedName ?? "Não informado"
        const setorList = s.sector
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
                      {setorList.length > 0 ? setorList.map((x, i) => (
                        <Badge key={`${s.id}-setor-${i}`} variant="secondary">{x}</Badge>
                      )) : <Badge variant="outline">Setor não informado</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="p-4 space-y-4">
                  {/* Seção de informações (mantém igual) */}
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
                        {setorList.length > 0 ? setorList.map((x, i) => (
                          <Badge key={`${s.id}-setor-c-${i}`} variant="secondary">{x}</Badge>
                        )) : <span className="text-sm text-muted-foreground">-</span>}
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

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									<div>
                      <label className="text-sm">Impacto no negócio</label>
										<Select
                        value={s.impact ? `${s.impact.score}-${s.impact.label}` : ""}
                        onValueChange={(v) => {
                          if (!v) return
                          const [scoreStr, ...labelParts] = v.split('-')
                          const score = Number(scoreStr)
                          const label = labelParts.join('-')
                          const item = impactPool.find(p => p.score === score && p.label === label)
                          if (item) update(s.id, { impact: item })
                        }}
										>
											<SelectTrigger>
												<SelectValue placeholder="Selecione" />
											</SelectTrigger>
											<SelectContent>
                          {impactPool.map((c, idx) => (
                            <SelectItem key={`imp-${idx}`} value={`${c.score}-${c.label}`}>
                              {`${c.score} - ${c.label}`}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

                    <div>
                      <label className="text-sm">Capacidade de execução</label>
                      <Select
                        value={s.capacity ? `${s.capacity.score}-${s.capacity.label}` : ""}
                        onValueChange={(v) => {
                          if (!v) return
                          const [scoreStr, ...labelParts] = v.split('-')
                          const score = Number(scoreStr)
                          const label = labelParts.join('-')
                          const item = capacityPool.find(p => p.score === score && p.label === label)
                          if (item) update(s.id, { capacity: item })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {capacityPool.map((c, idx) => (
                            <SelectItem key={`cap-${idx}`} value={`${c.score}-${c.label}`}>
                              {`${c.score} - ${c.label}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

									<div>
                      <label className="text-sm">Esforço necessário</label>
                      <Select
                        value={s.effort ? `${s.effort.score}-${s.effort.label}` : ""}
                        onValueChange={(v) => {
                          if (!v) return
                          const [scoreStr, ...labelParts] = v.split('-')
                          const score = Number(scoreStr)
                          const label = labelParts.join('-')
                          const item = effortPool.find(p => p.score === score && p.label === label)
                          if (item) update(s.id, { effort: item })
                        }}
                      >
											<SelectTrigger>
												<SelectValue placeholder="Selecione" />
											</SelectTrigger>
											<SelectContent>
                          {effortPool.map((c, idx) => (
                            <SelectItem key={`esf-${idx}`} value={`${c.score}-${c.label}`}>
                              {`${c.score} - ${c.label}`}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowManageModal(true)}
                      className="text-sm"
                    >
                      Gerenciar Classificações
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm">Pontuação da ideia</label>
                      <Input value={pontuacao} readOnly />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm">Classificação final</label>
                      <Input value={finalClass} readOnly />
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div>
										<label className="text-sm">Qual KPI de sucesso?</label>
										<MultiSelect
                        options={kpiPool.map((k: string) => ({ label: k, value: k }))}
											selected={s.kpis}
											onChange={(selected) => update(s.id, { kpis: selected })}
											placeholder="Selecione um ou mais KPIs"
										/>
										<div className="text-xs text-muted-foreground mt-1">
											Os KPIs selecionados ficam salvos e podem ser reutilizados.
										</div>
									</div>
									<div className="space-y-2">
										<label className="text-sm">Adicionar novo KPI à lista</label>
										<div className="flex gap-2">
											<Input
												placeholder="ex.: Lead time"
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														const v = (e.target as HTMLInputElement).value.trim()
                              onAddKpi(v)
															;(e.target as HTMLInputElement).value = ""
													}
												}}
											/>
											<Button
												variant="outline"
												onClick={(e) => {
													const input = (e.currentTarget.previousSibling as HTMLInputElement)
													const v = input.value.trim()
                            onAddKpi(v)
														input.value = ""
												}}
											>
												Adicionar
											</Button>
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
                        value="Admin Atual"
                        readOnly 
                      />
                    </div>

                    {pontuacao <= 9 && (
                      <div className="md:col-span-2">
										<label className="text-sm">Justificativa para não implantação</label>
										<Textarea
											rows={3}
                          value={s.rejectionReason ?? ""}
                          onChange={(e) => update(s.id, { rejectionReason: e.target.value })}
										/>
									</div>
                    )}
								</div>

								<div className="flex justify-end">
                    <Button onClick={() => todoast("Avaliação salva", `Sugestão #${s.ideaNumber} atualizada.`)}>
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

function ManageClassificationsModal({
  open,
  onOpenChange,
  impactPool,
  capacityPool,
  effortPool,
  onCreateClassification,
  onUpdateClassification,
  onDeleteClassification,
  kpiPool,
  onCreateKpi,
  onDeleteKpi,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  impactPool: ClassItem[]
  capacityPool: ClassItem[]
  effortPool: ClassItem[]
  onCreateClassification: (data: { label: string; score: number; type: "IMPACT" | "CAPACITY" | "EFFORT" }) => void
  onUpdateClassification: (data: { id: string; label: string; score: number }) => void
  onDeleteClassification: (data: { id: string }) => void
  kpiPool: string[]
  onCreateKpi: (data: { name: string }) => void
  onDeleteKpi: (data: { id: string }) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Classificações por Categoria</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="impact">
              <AccordionTrigger className="text-lg font-semibold">
                Impacto no Negócio ({impactPool.length} itens)
              </AccordionTrigger>
              <AccordionContent>
                <CategoryManagementSection
                  title="Impacto no Negócio"
                  items={impactPool}
                  color="bg-blue-50 dark:bg-blue-950/20"
                  type="IMPACT"
                  onCreate={onCreateClassification}
                  onUpdate={onUpdateClassification}
                  onDelete={onDeleteClassification}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="capacity">
              <AccordionTrigger className="text-lg font-semibold">
                Capacidade de Execução ({capacityPool.length} itens)
              </AccordionTrigger>
              <AccordionContent>
                <CategoryManagementSection
                  title="Capacidade de Execução"
                  items={capacityPool}
                  color="bg-green-50 dark:bg-green-950/20"
                  type="CAPACITY"
                  onCreate={onCreateClassification}
                  onUpdate={onUpdateClassification}
                  onDelete={onDeleteClassification}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="effort">
              <AccordionTrigger className="text-lg font-semibold">
                Esforço Necessário ({effortPool.length} itens)
              </AccordionTrigger>
              <AccordionContent>
                <CategoryManagementSection
                  title="Esforço Necessário"
                  items={effortPool}
                  color="bg-orange-50 dark:bg-orange-950/20"
                  type="EFFORT"
                  onCreate={onCreateClassification}
                  onUpdate={onUpdateClassification}
                  onDelete={onDeleteClassification}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CategoryManagementSection({
  title,
  items,
  color,
  type,
  onCreate,
  onUpdate,
  onDelete,
}: {
  title: string
  items: ClassItem[]
  color: string
  type: "IMPACT" | "CAPACITY" | "EFFORT"
  onCreate: (data: { label: string; score: number; type: "IMPACT" | "CAPACITY" | "EFFORT" }) => void
  onUpdate: (data: { id: string; label: string; score: number }) => void
  onDelete: (data: { id: string }) => void
}) {
  const [newLabel, setNewLabel] = useState("")
  const [newScore, setNewScore] = useState<number | "">("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const addItem = () => {
    if (!newLabel.trim() || newScore === "" || Number.isNaN(Number(newScore))) {
      toast({ 
        title: "Erro", 
        description: "Preencha todos os campos corretamente.",
        variant: "destructive"
      })
      return
    }
    
    onCreate({
      label: newLabel.trim(),
      score: Number(newScore),
      type
    })
    
    setNewLabel("")
    setNewScore("")
  }

  const removeItem = (index: number) => {
    const item = items[index]
    if (item?.id) {
      onDelete({ id: item.id })
    }
  }

  const editItem = (index: number, newLabel: string, newScore: number) => {
    if (!newLabel.trim() || Number.isNaN(newScore)) {
      toast({ 
        title: "Erro", 
        description: "Preencha todos os campos corretamente.",
        variant: "destructive"
      })
      return
    }

    const item = items[index]
    if (item?.id) {
      onUpdate({
        id: item.id,
        label: newLabel.trim(),
        score: newScore
      })
    }
    
    setEditingIndex(null)
  }

  return (
    <div className={`p-4 rounded-lg border ${color}`}>
      <div className="mb-6 p-4 border rounded-lg bg-white dark:bg-gray-900">
        <h4 className="font-medium mb-3">Adicionar Nova Classificação</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            className="md:col-span-2"
            placeholder="Rótulo da classificação"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <Input
            type="number"
            placeholder="Pontuação (0-10)"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value === "" ? "" : Number(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <Button onClick={addItem} className="w-full">
            Adicionar
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Classificações Existentes</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
              Nenhuma classificação cadastrada para {title}
            </div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex items-center gap-2 p-3 border rounded-lg bg-white dark:bg-gray-900">
                {editingIndex === index ? (
                  <EditingItemRow 
                    item={item}
                    onSave={(label, score) => editItem(index, label, score)}
                    onCancel={() => setEditingIndex(null)}
                  />
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {item.score}
                        </Badge>
                        <span className="font-medium">{item.label}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingIndex(index)}
                      >
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => removeItem(index)}
                      >
                        Remover
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function EditingItemRow({ 
  item, 
  onSave, 
  onCancel 
}: { 
  item: ClassItem
  onSave: (label: string, score: number) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(item.label)
  const [score, setScore] = useState<number | "">(item.score)

  const handleSave = () => {
    if (!label.trim() || score === "" || Number.isNaN(Number(score))) return
    onSave(label.trim(), Number(score))
  }

  return (
    <>
      <Input
        className="flex-1"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
      />
      <Input
        type="number"
        className="w-24"
        value={score}
        onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
      />
      <div className="flex gap-1">
        <Button size="sm" onClick={handleSave}>Salvar</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </>
  )
}

function todoast(title: string, description?: string) {
  toast({ title, description })
}