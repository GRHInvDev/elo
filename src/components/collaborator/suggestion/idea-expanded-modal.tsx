"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/trpc/react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ThumbsUp,
  MessageSquare,
  Trash2,
  Send,
  AlertTriangle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface IdeaExpandedModalProps {
  ideaId: string | null
  isOpen: boolean
  onClose: () => void
}

const TIMELINE_STEPS = [
  { status: "NEW", label: "Ainda não avaliada" },
  { status: "IN_REVIEW", label: "Em avaliação" },
  { status: "APPROVED", label: "Em orçamento" },
  { status: "IN_PROGRESS", label: "Em execução" },
  { status: "DONE", label: "Concluída" },
]

export function IdeaExpandedModal({
  ideaId,
  isOpen,
  onClose,
}: IdeaExpandedModalProps) {
  const utils = api.useUtils()
  const [commentText, setCommentText] = useState("")

  const { data: idea, isLoading } = api.suggestion.getPublicIdeaById.useQuery(
    { id: ideaId ?? "" },
    { enabled: Boolean(isOpen && ideaId) }
  )

  const toggleSupportMutation = api.suggestion.toggleSupport.useMutation({
    onSuccess: (data) => {
      toast({
        title: data.hasSupported ? "Apoio registrado!" : "Apoio removido.",
        description: data.hasSupported
          ? "Você apoiou esta ideia inovadora."
          : "Você retirou seu apoio.",
      })
      void utils.suggestion.getPublicIdeaById.invalidate({ id: ideaId ?? "" })
      void utils.campaign.getPublicById.invalidate()
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    },
  })

  const addCommentMutation = api.suggestion.addComment.useMutation({
    onSuccess: () => {
      setCommentText("")
      toast({ title: "Comentário adicionado!" })
      void utils.suggestion.getPublicIdeaById.invalidate({ id: ideaId ?? "" })
      void utils.campaign.getPublicById.invalidate()
    },
    onError: (err) => {
      toast({ title: "Erro ao comentar", description: err.message, variant: "destructive" })
    },
  })

  const deleteCommentMutation = api.suggestion.deleteComment.useMutation({
    onSuccess: () => {
      toast({ title: "Comentário excluído." })
      void utils.suggestion.getPublicIdeaById.invalidate({ id: ideaId ?? "" })
      void utils.campaign.getPublicById.invalidate()
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    },
  })

  if (!isOpen) return null

  const handleToggleSupport = () => {
    if (!ideaId) return
    toggleSupportMutation.mutate({ suggestionId: ideaId })
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ideaId || !commentText.trim()) return
    addCommentMutation.mutate({
      suggestionId: ideaId,
      content: commentText.trim(),
    })
  }

  const handleDeleteComment = (commentId: string) => {
    if (confirm("Excluir seu comentário?")) {
      deleteCommentMutation.mutate({ commentId })
    }
  }

  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.status === idea?.status)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden bg-card text-card-foreground border border-border shadow-2xl rounded-2xl">

        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60 bg-muted/20">
          <DialogTitle className="text-xs font-normal text-muted-foreground">
            {idea?.campaign ? (
              <span>{idea.campaign.name} &nbsp;/&nbsp; </span>
            ) : (
              <span>Ideias Livres &nbsp;/&nbsp; </span>
            )}
            <span className="text-foreground font-semibold">
              Ideia #{idea ? String(idea.ideaNumber).padStart(3, "0") : ""}
            </span>
          </DialogTitle>

          {idea && (
            <div className="flex items-center gap-2.5 pt-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                {idea.authorInitials}
              </div>
              <div className="text-xs min-w-0">
                <span className="font-bold text-foreground truncate">{idea.authorName}</span>
                {idea.authorSector && (
                  <span className="text-muted-foreground"> · {idea.authorSector}</span>
                )}
                <span className="text-muted-foreground">
                  {" "}
                  · enviada há{" "}
                  {formatDistanceToNow(new Date(idea.createdAt), {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="p-4 sm:p-6 max-h-[75vh] sm:max-h-[78vh] overflow-y-auto space-y-5 sm:space-y-6">
          {isLoading || !idea ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {idea.status !== "NOT_IMPLEMENTED" ? (
                <div className="bg-card dark:bg-[#131518] border border-border/80 rounded-2xl p-3.5 sm:p-5">
                  <div className="flex items-center justify-between relative">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const isDone = currentStepIndex > idx
                      const isCurrent = currentStepIndex === idx

                      return (
                        <div
                          key={step.status}
                          className="flex flex-col items-center gap-1.5 sm:gap-2.5 flex-1 relative text-center"
                        >
                          {idx > 0 && (
                            <div
                              className={cn(
                                "absolute top-1 sm:top-1.5 -left-1/2 w-full h-0.5 transition-colors z-0",
                                isDone || isCurrent ? "bg-[#34d399]" : "bg-border/60"
                              )}
                            />
                          )}

                          <div
                            className={cn(
                              "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 transition-all relative z-10",
                              isDone
                                ? "bg-[#34d399] border-[#34d399]"
                                : isCurrent
                                ? "bg-[#c2492f] border-[#c2492f] ring-4 ring-[#c2492f]/20"
                                : "bg-card border-border/80"
                            )}
                          />

                          <span
                            className={cn(
                              "text-[9px] sm:text-[11px] font-medium leading-tight relative z-10",
                              isDone
                                ? "text-[#34d399]"
                                : isCurrent
                                ? "text-[#e0673f] font-bold"
                                : "text-muted-foreground"
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-foreground -mb-1">
                        Ideia não implantada
                      </h5>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Devolutiva do comitê de avaliação
                      </span>
                    </div>
                  </div>

                  {idea.rejectionReason ? (
                    <div className="p-3.5 rounded-xl bg-background/80 border border-amber-500/20 text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {idea.rejectionReason}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed pl-1">
                      Esta ideia foi avaliada pelo comitê e não será implementada no escopo atual desta campanha.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {idea.problem && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Problema identificado
                    </div>
                    <div className="text-xs sm:text-sm text-foreground/90 bg-muted/20 border border-border/50 rounded-xl p-3.5 sm:p-4 leading-relaxed">
                      {idea.problem}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Solução proposta
                  </div>
                  <div className="text-xs sm:text-sm text-foreground/90 bg-muted/20 border border-border/50 rounded-xl p-3.5 sm:p-4 leading-relaxed">
                    {idea.description}
                  </div>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card dark:bg-[#131518] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                {!idea.isOwner ? (
                  <button
                    onClick={handleToggleSupport}
                    disabled={toggleSupportMutation.isPending}
                    className={cn(
                      "gap-2 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer w-full sm:w-auto",
                      idea.hasSupported
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-[#3e3d3dc5] hover:bg-[#314e31f7] text-white"
                    )}
                  >
                    <ThumbsUp
                      className={cn(
                        "w-4 h-4"
                      )}
                    />
                    {idea.hasSupported ? "Você apoiou esta ideia" : "Apoiar esta ideia"}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <span>Você é o autor desta ideia</span>
                  </div>
                )}

                <span className="text-xs text-muted-foreground font-medium text-center sm:text-left">
                  {idea.supportsCount} {idea.supportsCount === 1 ? "pessoa já apoiou esta ideia" : "pessoas já apoiaram esta ideia"}
                </span>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Discussão e aperfeiçoamento
                    <span className="text-xs text-muted-foreground font-normal">
                      · {idea.comments.length} comentários
                    </span>
                  </h4>
                </div>

                <div className="space-y-3">
                  {idea.comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Nenhum comentário ainda. Seja o primeiro a sugerir melhorias para esta ideia!
                    </p>
                  ) : (
                    idea.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2.5 sm:gap-3 group">
                        <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {comment.authorInitials}
                        </div>

                        <div className="flex-1 bg-muted/25 border border-border/50 rounded-xl p-3 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <span className="font-bold text-xs text-foreground truncate">
                                {comment.authorName}
                              </span>
                              {comment.authorSector && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                  · {comment.authorSector}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), {
                                  locale: ptBR,
                                })}
                              </span>

                              {comment.isOwner && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-muted-foreground/50 hover:text-destructive transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-0.5"
                                  title="Excluir meu comentário"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5">
                  <div className="flex items-center gap-2 sm:hidden">
                    <div className="w-6 h-6 rounded-full bg-primary/15 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                      EU
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Novo comentário</span>
                  </div>

                  <div className="hidden sm:flex w-7 h-7 rounded-full bg-primary/15 text-primary font-bold text-[11px] items-center justify-center shrink-0 mt-1">
                    EU
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <Textarea
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Escreva um comentário para ajudar a aperfeiçoar essa ideia..."
                      className="text-xs bg-muted/20 resize-none rounded-xl w-full"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                      className="h-9 sm:h-auto px-4 self-stretch rounded-xl text-xs gap-1 justify-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="sm:hidden">Enviar</span>
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}