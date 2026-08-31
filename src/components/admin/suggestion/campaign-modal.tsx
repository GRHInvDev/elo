"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { Search, Lock, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const STATUS_PILL_CONFIG = {
  ACTIVE: { label: "Ativa", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  DRAFT: { label: "Rascunho", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  CLOSED: { label: "Encerrada", className: "bg-muted text-muted-foreground border-border" },
}

const STATUS_MAPPING: Record<string, string> = {
  NEW: "Ainda não avaliado",
  IN_REVIEW: "Em avaliação",
  APPROVED: "Em orçamento",
  IN_PROGRESS: "Em execução",
  DONE: "Concluído",
  NOT_IMPLEMENTED: "Não implantado",
}

interface CampaignModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId?: string | null
  onOpenIdeaDetails?: (ideaId: string) => void
}

export function CampaignModal({
  isOpen,
  onClose,
  campaignId,
  onOpenIdeaDetails,
}: CampaignModalProps) {
  const isEditing = Boolean(campaignId)
  const utils = api.useUtils()

  const [activeTab, setActiveTab] = useState<"editar" | "ideias">("editar")
  const [name, setName] = useState("")
  const [objective, setObjective] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "CLOSED">("ACTIVE")
  const [isPrivate, setIsPrivate] = useState(false)
  const [ideaSearch, setIdeaSearch] = useState("")

  const { data: campaignData, isLoading: isLoadingCampaign } = api.campaign.getById.useQuery(
    { id: campaignId! },
    { enabled: Boolean(campaignId && isOpen) }
  )

  useEffect(() => {
    if (isEditing && campaignData) {
      setName(campaignData.name)
      setObjective(campaignData.objective)
      setStartDate(campaignData.startDate ? (new Date(campaignData.startDate).toISOString().split("T")[0] ?? "") : "")
      setEndDate(campaignData.endDate ? (new Date(campaignData.endDate).toISOString().split("T")[0] ?? "") : "")
      setStatus(campaignData.status)
      setIsPrivate(campaignData.isPrivate)
    } else if (!isEditing) {
      // Valores padrão para criação
      const today = new Date()
      const inThirtyDays = new Date()
      inThirtyDays.setDate(today.getDate() + 30)

      setName("")
      setObjective("")
      setStartDate(today.toISOString().split("T")[0] ?? "")
      setEndDate(inThirtyDays.toISOString().split("T")[0] ?? "")
      setStatus("ACTIVE")
      setIsPrivate(false)
      setActiveTab("editar")
    }
  }, [isEditing, campaignData, isOpen])

  const createMutation = api.campaign.create.useMutation({
    onSuccess: () => {
      toast({ title: "Campanha criada!", description: "A nova campanha foi publicada com sucesso." })
      void utils.campaign.list.invalidate()
      void utils.suggestion.listKanban.invalidate()
      onClose()
    },
    onError: (error) => {
      toast({ title: "Erro ao criar campanha", description: error.message, variant: "destructive" })
    },
  })

  const updateMutation = api.campaign.update.useMutation({
    onSuccess: () => {
      toast({ title: "Campanha atualizada!", description: "As alterações foram salvas com sucesso." })
      void utils.campaign.list.invalidate()
      void utils.campaign.getById.invalidate({ id: campaignId! })
      void utils.suggestion.listKanban.invalidate()
      onClose()
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar alterações", description: error.message, variant: "destructive" })
    },
  })

  const closeMutation = api.campaign.close.useMutation({
    onSuccess: () => {
      toast({ title: "Campanha encerrada!", description: "A campanha foi finalizada com sucesso." })
      void utils.campaign.list.invalidate()
      void utils.campaign.getById.invalidate({ id: campaignId! })
      void utils.suggestion.listKanban.invalidate()
      onClose()
    },
    onError: (error) => {
      toast({ title: "Erro ao encerrar", description: error.message, variant: "destructive" })
    },
  })

  const handleSave = (customStatus?: "DRAFT" | "ACTIVE" | "CLOSED") => {
    if (!name.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o nome da campanha.", variant: "destructive" })
      return
    }
    if (!objective.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o objetivo da campanha.", variant: "destructive" })
      return
    }
    if (!startDate || !endDate) {
      toast({ title: "Datas obrigatórias", description: "Informe as datas de início e encerramento.", variant: "destructive" })
      return
    }

    const start = new Date(startDate + "T00:00:00")
    const end = new Date(endDate + "T23:59:59")

    if (end < start) {
      toast({ title: "Data inválida", description: "A data de encerramento não pode ser anterior ao início.", variant: "destructive" })
      return
    }

    const targetStatus = customStatus ?? status

    if (isEditing && campaignId) {
      updateMutation.mutate({
        id: campaignId,
        name: name.trim(),
        objective: objective.trim(),
        startDate: start,
        endDate: end,
        status: targetStatus,
        isPrivate,
      })
    } else {
      createMutation.mutate({
        name: name.trim(),
        objective: objective.trim(),
        startDate: start,
        endDate: end,
        status: targetStatus,
        isPrivate,
      })
    }
  }

  const filteredCampaignIdeas = useMemo(() => {
    if (!campaignData?.suggestions) return []
    if (!ideaSearch.trim()) return campaignData.suggestions
    const q = ideaSearch.toLowerCase()
    return campaignData.suggestions.filter(
      (s) =>
        s.description.toLowerCase().includes(q) ||
        (s.problem?.toLowerCase().includes(q) ?? false) ||
        (s.user ? `${s.user.firstName} ${s.user.lastName}`.toLowerCase().includes(q) : false) ||
        String(s.ideaNumber).includes(q)
    )
  }, [campaignData?.suggestions, ideaSearch])

  const statusPill = STATUS_PILL_CONFIG[status] || STATUS_PILL_CONFIG.ACTIVE

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[560px] w-[95vw] p-0 overflow-hidden gap-0 border bg-card text-card-foreground shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">
          {isEditing ? `Gerenciar campanha — ${name}` : "Criar nova campanha"}
        </DialogTitle>

        <div className="border-b bg-muted/40 p-5 pb-4 pr-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold tracking-tight">
                  {isEditing ? (name || "Gerenciar campanha") : "Nova campanha"}
                </h2>
                {isEditing && (
                  <Badge variant="outline" className={`${statusPill.className} text-[11px] font-semibold px-2 py-0.5`}>
                    {statusPill.label}
                  </Badge>
                )}
                {isPrivate && (
                  <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Privada
                  </Badge>
                )}
              </div>
              {isEditing && campaignData && (
                <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2.5">
                  <span><b>{campaignData.ideasCount}</b> ideias enviadas</span>
                  <span>•</span>
                  <span><b>{campaignData.participantsCount}</b> participantes</span>
                  <span>•</span>
                  <span><b>{campaignData.implementedCount}</b> implementadas</span>
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-4 mt-5 -mb-4 border-b border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab("editar")}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "editar"
                    ? "border-primary text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Editar campanha
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ideias")}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === "ideias"
                    ? "border-primary text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Ideias publicadas
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {campaignData?.ideasCount ?? 0}
                </Badge>
              </button>
            </div>
          )}
        </div>

        <div className="p-6 max-h-[64vh] overflow-y-auto space-y-6">
          {isLoadingCampaign && isEditing ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">Carregando dados da campanha...</span>
            </div>
          ) : (
            <>
              {activeTab === "editar" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="camp-name" className="text-sm font-semibold">
                      Nome da campanha *
                    </Label>
                    <Input
                      id="camp-name"
                      placeholder="Ex: Redução de custos logísticos"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-muted/30 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="camp-objective" className="text-sm font-semibold">
                      Objetivo da campanha *
                    </Label>
                    <Textarea
                      id="camp-objective"
                      rows={3}
                      placeholder="Descreva o que a organização busca resolver ou otimizar com esta campanha..."
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className="bg-muted/30 text-sm resize-none leading-relaxed"
                    />
                    <p className="text-[11.5px] text-muted-foreground">
                      Esse texto aparece para os colaboradores na tela da campanha — seja claro sobre os objetivos esperados.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Período de participação *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Início</span>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-muted/30 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Encerramento</span>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-muted/30 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Status da campanha</Label>
                      <Select value={status} onValueChange={(val: "DRAFT" | "ACTIVE" | "CLOSED") => setStatus(val)}>
                        <SelectTrigger className="w-full sm:w-60 bg-muted/30">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Ativa (Aberta)</SelectItem>
                          <SelectItem value="DRAFT">Rascunho (Oculta)</SelectItem>
                          <SelectItem value="CLOSED">Encerrada (Finalizada)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        Campanha privada?
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-[540px]">
                        Quando ativada, a campanha fica privada e visível apenas para administradores e públicos restritos definidos pela gestão.
                      </p>
                    </div>
                    <Switch
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                  </div>
                </div>
              )}

              {activeTab === "ideias" && isEditing && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar ideias nesta campanha..."
                      value={ideaSearch}
                      onChange={(e) => setIdeaSearch(e.target.value)}
                      className="bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground w-full text-sm"
                    />
                  </div>

                  {filteredCampaignIdeas.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl p-8">
                      <p className="text-sm font-medium">Nenhuma ideia encontrada para esta campanha.</p>
                      <p className="text-xs mt-1">As ideias submetidas pelos colaboradores aparecerão listadas aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCampaignIdeas.map((idea) => {
                        const fullName = `${idea.user?.firstName ?? ""} ${idea.user?.lastName ?? ""}`.trim()
                        const authorName = idea.isNameVisible && idea.user ? fullName || (idea.submittedName ?? "Colaborador") : (idea.submittedName ?? "Colaborador anônimo")

                        return (
                          <div
                            key={idea.id}
                            className="p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors cursor-pointer space-y-2"
                            onClick={() => {
                              if (onOpenIdeaDetails) onOpenIdeaDetails(idea.id)
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                <span>#{idea.ideaNumber}</span>
                                <span>•</span>
                                <span>{authorName}</span>
                                {idea.user?.setor && <span>({idea.user.setor})</span>}
                              </div>
                              <Badge variant="outline" className="text-[11px] font-medium">
                                {STATUS_MAPPING[idea.status] ?? idea.status}
                              </Badge>
                            </div>

                            <div className="font-semibold text-sm leading-snug">
                              {idea.description}
                            </div>

                            {idea.problem && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {idea.problem}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[11.5px] text-muted-foreground pt-1 border-t border-border/40">
                              <span>{format(new Date(idea.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                              <span className="text-primary font-medium hover:underline">Ver detalhes da ideia →</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-4 px-6 border-t bg-muted/30 flex flex-wrap items-center justify-between gap-3">
          {isEditing && status !== "CLOSED" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => closeMutation.mutate({ id: campaignId! })}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? "Encerrando..." : "Encerrar campanha"}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>

            {!isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave("DRAFT")}
                  disabled={createMutation.isPending}
                >
                  Salvar rascunho
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  onClick={() => handleSave("ACTIVE")}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Publicando..." : "Publicar campanha"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={() => handleSave()}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}