"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/trpc/react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Lightbulb, Trash2, ThumbsUp, MessageSquare, Search } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface MyIdeasModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenIdeaDetail: (ideaId: string) => void
}

const STATUS_CONFIG: Record<string, { label: string; className: string; dotColor: string }> = {
  NEW: { label: "Ainda não avaliada", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30", dotColor: "bg-blue-500" },
  IN_REVIEW: { label: "Em avaliação", className: "bg-lime-500/15 text-lime-600 dark:text-lime-400 border-lime-500/30", dotColor: "bg-lime-500" },
  APPROVED: { label: "Em orçamento", className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30", dotColor: "bg-yellow-500" },
  IN_PROGRESS: { label: "Em execução", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", dotColor: "bg-amber-500" },
  DONE: { label: "Concluída", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-500" },
  NOT_IMPLEMENTED: { label: "Não implantada", className: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30", dotColor: "bg-zinc-400" },
}

const FILTER_TABS = [
  { key: "ALL", label: "Todas" },
  { key: "IN_PROGRESS", label: "Em andamento" },
  { key: "DONE", label: "Concluídas" },
  { key: "NOT_IMPLEMENTED", label: "Não implantadas" },
]

export function MyIdeasModal({ isOpen, onClose, onOpenIdeaDetail }: MyIdeasModalProps) {
  const utils = api.useUtils()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("ALL")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: myIdeas = [], isLoading } = api.suggestion.listMyIdeas.useQuery(undefined, {
    enabled: isOpen,
  })

  const deleteMutation = api.suggestion.deleteMyIdea.useMutation({
    onSuccess: () => {
      toast({ title: "Ideia excluída com sucesso." })
      void utils.suggestion.listMyIdeas.invalidate()
      void utils.campaign.getPublicById.invalidate()
      setDeletingId(null)
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir ideia", description: err.message, variant: "destructive" })
      setDeletingId(null)
    },
  })

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta ideia?")) {
      setDeletingId(id)
      deleteMutation.mutate({ id })
    }
  }

  const filteredIdeas = useMemo(() => {
    return myIdeas.filter((idea) => {
      if (activeTab === "IN_PROGRESS") {
        if (!["NEW", "IN_REVIEW", "APPROVED", "IN_PROGRESS"].includes(idea.status)) return false
      } else if (activeTab === "DONE") {
        if (idea.status !== "DONE") return false
      } else if (activeTab === "NOT_IMPLEMENTED") {
        if (idea.status !== "NOT_IMPLEMENTED") return false
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchNumber = String(idea.ideaNumber).includes(q)
        const matchDesc = idea.description?.toLowerCase().includes(q) ?? false
        const matchProb = idea.problem?.toLowerCase().includes(q) ?? false
        const matchCamp = idea.campaign?.name?.toLowerCase().includes(q) ?? false
        return matchNumber || matchDesc || matchProb || matchCamp
      }

      return true
    })
  }, [myIdeas, activeTab, searchTerm])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden bg-card text-card-foreground border border-border shadow-2xl rounded-2xl">
        <DialogHeader className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Minhas ideias
          </div>
          <DialogTitle className="text-base sm:text-lg font-bold">
            Ideias que você sugeriu ({myIdeas.length})
          </DialogTitle>
        </DialogHeader>

        {myIdeas.length > 0 && (
          <div className="px-4 sm:px-5 pt-3 pb-1 border-b border-border/40 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, problema ou número da ideia..."
                className="pl-8 h-8 text-xs bg-muted/20 border-border/60 rounded-lg w-full"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {FILTER_TABS.map((tab) => {
                const count = myIdeas.filter((idea) => {
                  if (tab.key === "ALL") return true
                  if (tab.key === "IN_PROGRESS") return ["NEW", "IN_REVIEW", "APPROVED", "IN_PROGRESS"].includes(idea.status)
                  if (tab.key === "DONE") return idea.status === "DONE"
                  if (tab.key === "NOT_IMPLEMENTED") return idea.status === "NOT_IMPLEMENTED"
                  return true
                }).length

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full",
                      activeTab === tab.key
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="p-3.5 sm:p-5 max-h-[65vh] sm:max-h-[60vh] overflow-y-auto space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : myIdeas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2 px-4">
              <Lightbulb className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
              <p className="text-sm font-medium">Você ainda não enviou nenhuma ideia.</p>
              <p className="text-xs text-muted-foreground/70">
                Escolha uma campanha ativa e participe enviando a sua primeira ideia!
              </p>
            </div>
          ) : filteredIdeas.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground space-y-1 px-4">
              <p className="text-xs font-medium">Nenhuma ideia encontrada com os filtros selecionados.</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setActiveTab("ALL")
                }}
                className="text-xs text-primary h-auto p-0"
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            filteredIdeas.map((idea) => {
              const statusCfg = STATUS_CONFIG[idea.status] ?? {
                label: "Ainda não avaliada",
                className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
                dotColor: "bg-blue-500",
              }
              const titleText = idea.problem ?? idea.description

              return (
                <div
                  key={idea.id}
                  className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-background/50 hover:bg-muted/20 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">                        
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            #{String(idea.ideaNumber).padStart(3, "0")}
                          </span>
                          <div className={`${statusCfg.className} text-[10px] font-semibold gap-1.5 py-0.5 bg-transparent`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                            {statusCfg.label}
                          </div>
                        </div>

                        <div className="flex items-center bg-primary text-primary-foreground px-2 py-0.5 rounded-md">
                          {idea.campaign ? (
                            <span className="text-[10px] font-medium rounded-md truncate max-w-[220px]">
                              {idea.campaign.name}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium bg-muted text-muted-foreground border border-border/40 px-2 py-0.5 rounded-md">
                              Sem campanha
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                        {titleText}
                      </h4>
                      {idea.problem && idea.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {idea.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                      <span>
                        {format(new Date(idea.createdAt), "dd 'de' MMM., yyyy", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {idea.supportsCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {idea.commentsCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 pt-1 sm:pt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2.5 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer font-medium"
                        onClick={() => {
                          onClose()
                          onOpenIdeaDetail(idea.id)
                        }}
                      >
                        Ver detalhes →
                      </Button>
                      {idea.status === "NEW" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          disabled={deletingId === idea.id}
                          onClick={() => handleDelete(idea.id)}
                          title="Excluir ideia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}