"use client"

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
import { Trophy, ThumbsUp, Calendar } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CampaignWinnersModalProps {
  campaignId: string | null
  isOpen: boolean
  onClose: () => void
  onOpenIdeaDetail: (ideaId: string) => void
}

type WinningIdea = {
  id: string
  ideaNumber: number
  description: string
  problem: string | null
  status: string
  isNameVisible: boolean
  submittedName: string | null
  submittedSector: string | null
  authorName: string
  authorSector: string | null
  supportsCount: number
  commentsCount: number
  finalScore: number | null
  createdAt: Date
}

export function CampaignWinnersModal({
  campaignId,
  isOpen,
  onClose,
  onOpenIdeaDetail,
}: CampaignWinnersModalProps) {
  const { data: campaign, isLoading } = api.campaign.getClosedWinners.useQuery(
    { id: campaignId ?? "" },
    { enabled: Boolean(isOpen && campaignId) }
  )

  if (!isOpen) return null

  const winningIdeas: WinningIdea[] = (campaign?.winningIdeas as WinningIdea[]) || []
  const count = winningIdeas.length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden bg-card text-card-foreground border border-border shadow-2xl rounded-2xl">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60 bg-muted/20">
          <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
            {campaign?.name ?? <Skeleton className="h-6 w-60 inline-block" />}
          </DialogTitle>
          {campaign && (
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Encerrada em {format(new Date(campaign.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <span className="hidden sm:inline">•</span>
              <span><b>{campaign.totalIdeas}</b> ideias enviadas</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-emerald-400 font-semibold"><b>{count}</b> aprovadas/implementadas</span>
            </div>
          )}
        </DialogHeader>

        <div className="p-4 sm:p-6 max-h-[75vh] sm:max-h-[70vh] overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : count === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2 px-4">
              <p className="text-sm font-medium">Nenhuma ideia com status aprovado nesta campanha.</p>
              <p className="text-xs text-muted-foreground/70">
                O comitê avaliou todas as {campaign?.totalIdeas} ideias participantes.
              </p>
            </div>
          ) : count === 1 && winningIdeas[0] ? (
            (() => {
              const singleWinner = winningIdeas[0]
              return (
                <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-950/10 p-4 sm:p-6 space-y-4 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-bold flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" /> Ideia Implementada & Destaque
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground font-bold">
                      #{String(singleWinner.ideaNumber).padStart(3, "0")}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">
                      {singleWinner.problem ?? singleWinner.description}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {singleWinner.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-emerald-500/20 text-xs gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {singleWinner.authorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground truncate block sm:inline">{singleWinner.authorName}</span>
                        {singleWinner.authorSector && (
                          <span className="text-muted-foreground"> · {singleWinner.authorSector}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-1 sm:pt-0">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="w-3 h-3 text-emerald-400" /> {singleWinner.supportsCount} apoios
                      </span>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                        onClick={() => {
                          onClose()
                          onOpenIdeaDetail(singleWinner.id)
                        }}
                      >
                        Ver ideia completa →
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })()
          ) : (
            <div className={`grid gap-4 ${count === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
              {winningIdeas.map((idea, idx) => (
                <div
                  key={idea.id}
                  className="rounded-xl border border-emerald-500/20 bg-card/60 hover:bg-muted/30 p-3.5 sm:p-4 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                        ★ Aprovada #{idx + 1}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        #{String(idea.ideaNumber).padStart(3, "0")}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-foreground line-clamp-2">
                      {idea.problem ?? idea.description}
                    </h4>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {idea.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium truncate max-w-[150px]">
                        {idea.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-emerald-400" /> {idea.supportsCount}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 justify-center h-8"
                      onClick={() => {
                        onClose()
                        onOpenIdeaDetail(idea.id)
                      }}
                    >
                      Ver ideia completa →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}