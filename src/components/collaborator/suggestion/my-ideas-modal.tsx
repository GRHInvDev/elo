"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/trpc/react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Lightbulb, Trash2, ThumbsUp, MessageSquare } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface MyIdeasModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenIdeaDetail: (ideaId: string) => void
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW: { label: "Ainda não avaliada", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  IN_REVIEW: { label: "Em avaliação", className: "bg-lime-500/15 text-lime-400 border-lime-500/30" },
  APPROVED: { label: "Em orçamento", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  IN_PROGRESS: { label: "Em execução", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  DONE: { label: "Concluída", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  NOT_IMPLEMENTED: { label: "Não implantada", className: "bg-zinc-700/30 text-zinc-400 border-zinc-600/30" },
}

export function MyIdeasModal({ isOpen, onClose, onOpenIdeaDetail }: MyIdeasModalProps) {
  const utils = api.useUtils()
  const { data: myIdeas = [], isLoading } = api.suggestion.listMyIdeas.useQuery(undefined, {
    enabled: isOpen,
  })

  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden bg-card text-card-foreground border border-border shadow-2xl rounded-2xl">
        <DialogHeader className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-primary" />
            Minhas ideias
          </div>
          <DialogTitle className="text-base sm:text-lg font-bold">
            Ideias que você sugeriu ({myIdeas.length})
          </DialogTitle>
        </DialogHeader>

        <div className="p-3.5 sm:p-5 max-h-[70vh] sm:max-h-[65vh] overflow-y-auto space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : myIdeas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2 px-4">
              <Lightbulb className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">Você ainda não enviou nenhuma ideia.</p>
              <p className="text-xs text-muted-foreground/70">
                Escolha uma campanha ativa e participe enviando a sua primeira ideia!
              </p>
            </div>
          ) : (
            myIdeas.map((idea) => {
              const statusCfg = STATUS_CONFIG[idea.status] ?? {
                label: "Ainda não avaliado",
                className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
              }
              const titleText = idea.problem ?? idea.description

              return (
                <div
                  key={idea.id}
                  className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-background/50 hover:bg-muted/20 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                          #{String(idea.ideaNumber).padStart(3, "0")}
                        </span>
                        {idea.campaign && (
                          <span className="text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                            🏷️ {idea.campaign.name}
                          </span>
                        )}
                        <Badge variant="outline" className={`${statusCfg.className} text-[10px] font-semibold`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground line-clamp-2">
                        {titleText}
                      </h4>
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
                        className="h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
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
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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