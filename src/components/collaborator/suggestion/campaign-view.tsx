"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/trpc/react"
import {
  Search,
  Plus,
  Clock,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  Lock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  User,
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface CampaignViewProps {
  campaignId: string
  onBack: () => void
  onNewIdea: (campaignId: string, isPrivate?: boolean) => void
  onOpenIdeaDetail: (ideaId: string) => void
  onOpenMyIdeas?: () => void
}

const STATUS_MAPPING: Record<string, string> = {
  NEW: "Ainda não avaliada",
  IN_REVIEW: "Em avaliação",
  APPROVED: "Em orçamento",
  IN_PROGRESS: "Em execução",
  DONE: "Concluída",
  NOT_IMPLEMENTED: "Não implantada",
}

const ITEMS_PER_PAGE = 6

export function CampaignView({
  campaignId,
  onBack,
  onNewIdea,
  onOpenIdeaDetail,
  onOpenMyIdeas,
}: CampaignViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortFilter, setSortFilter] = useState<"most_supported" | "recent">("most_supported")
  const [statusFilter] = useState<string>("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  const { data: campaign, isLoading } = api.campaign.getPublicById.useQuery(
    { id: campaignId },
    { enabled: Boolean(campaignId) }
  )

  const daysLeft = useMemo(() => {
    if (!campaign?.endDate) return 0
    return Math.max(0, differenceInDays(new Date(campaign.endDate), new Date()))
  }, [campaign?.endDate])

  const filteredSuggestions = useMemo(() => {
    if (!campaign?.suggestions) return []

    let list = [...campaign.suggestions]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        (s) =>
          s.description.toLowerCase().includes(q) ||
          Boolean(s.problem?.toLowerCase()?.includes(q)) ||
          s.authorName.toLowerCase().includes(q) ||
          String(s.ideaNumber).includes(q)
      )
    }

    if (statusFilter !== "ALL") {
      list = list.filter((s) => s.status === statusFilter)
    }

    if (sortFilter === "most_supported") {
      list.sort((a, b) => b.supportsCount - a.supportsCount)
    } else {
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    return list
  }, [campaign?.suggestions, searchTerm, sortFilter, statusFilter])

  const totalPages = Math.ceil(filteredSuggestions.length / ITEMS_PER_PAGE) || 1
  const paginatedSuggestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredSuggestions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredSuggestions, currentPage])

  if (isLoading || !campaign) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para campanhas
        </button>

        {onOpenMyIdeas && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenMyIdeas}
            className="text-xs font-semibold gap-1.5 h-8 px-3 rounded-xl border-border/80 hover:bg-muted/60 cursor-pointer shadow-xs"
          >
            Minhas ideias
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/90 dark:bg-[#131518] p-4 sm:p-6 md:p-7 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              {campaign.isPrivate && (
                <span className="text-[10.5px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Confidencial
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {campaign.name}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {campaign.objective}
            </p>
          </div>

          <button
            onClick={() => onNewIdea(campaign.id, campaign.isPrivate)}
            className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shrink-0 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova ideia
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-4 sm:mt-5 pt-3 border-t border-border/40 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {daysLeft > 0
                ? `Encerra em ${daysLeft} dias (${format(new Date(campaign.endDate), "dd 'de' MMM.", { locale: ptBR })})`
                : "Encerramento hoje"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{campaign.ideasCount} ideias enviadas</span>
          </div>
        </div>
      </div>

      {!campaign.isPrivate && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 dark:bg-[#201515] border border-red-500/20 dark:border-[#44231f] text-red-700 dark:text-[#d48372] text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-[#e0673f]" />
          <span>Antes de enviar, veja se sua ideia já foi sugerida abaixo</span>
        </div>
      )}

      {campaign.isPrivate && (
        <div className="p-6 sm:p-8 text-center rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3"> 
          <Lock className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-amber-400" />
          <h3 className="text-base font-bold text-foreground">Esta é uma campanha confidencial</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Nesta campanha, as propostas são tratadas de forma privativa. Você só visualiza as ideias que você mesmo enviou.
          </p>
        </div>
      )}

      {!campaign.isPrivate && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar ideias nesta campanha..."
              className="pl-9 h-10 text-xs bg-card dark:bg-[#131518] border-border/80 rounded-xl w-full"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setSortFilter("most_supported")
                setCurrentPage(1)
              }}
              className={cn(
                "h-9 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center",
                sortFilter === "most_supported"
                  ? "bg-muted/80 text-foreground border-border"
                  : "bg-card dark:bg-[#1a1d24] text-muted-foreground border-border/80 hover:text-foreground"
              )}
            >
              Mais votadas
            </button>

            <button
              onClick={() => {
                setSortFilter("recent")
                setCurrentPage(1)
              }}
              className={cn(
                "h-9 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                sortFilter === "recent"
                  ? "bg-muted/80 text-foreground border-border"
                  : "bg-card dark:bg-[#1a1d24] text-muted-foreground border-border/80 hover:text-foreground"
              )}
            >
              Recentes
            </button>
          </div>
        </div>
      )}

      {!campaign.isPrivate && (
        <div className="space-y-4">
          {filteredSuggestions.length === 0 ? (
            <div className="py-14 sm:py-16 text-center text-muted-foreground space-y-2 border border-dashed rounded-2xl p-4">
              <p className="text-sm font-medium">Nenhuma ideia encontrada.</p>
              <p className="text-xs text-muted-foreground/70">
                Seja o primeiro a enviar uma ideia para esta campanha!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedSuggestions.map((idea) => {
                const statusLabel = STATUS_MAPPING[idea.status] ?? idea.status
                const isInactive = idea.isNotImplemented && campaign.status === "ACTIVE" && !idea.isOwner

                return (
                  <div
                    key={idea.id}
                    className={cn(
                      "rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between space-y-3.5 shadow-xs relative group overflow-hidden",
                      isInactive
                        ? "bg-muted/40 border-border/40 opacity-60 pointer-events-none select-none cursor-default"
                        : "border-border/80 hover:border-primary/40 hover:shadow-md bg-gradient-to-br from-[#ffffff45] to-[#686f6f64] dark:from-[#71757937] dark:to-[#222323] dark:border-border/60 dark:hover:border-primary/40 dark:hover:bg-[#16181d]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isInactive ? (
                          <div className="w-8 h-8 rounded-full bg-muted/70 text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0 border border-border/40">
                            <User className="w-4 h-4 opacity-50" />
                          </div>
                        ) : idea.isNameVisible ? (
                          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/25 font-bold text-xs flex items-center justify-center shrink-0">
                            {idea.authorName.slice(0, 2).toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0 border border-border/40">
                            <User className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          {isInactive ? (
                            <div className="flex items-center gap-1.5 py-0.5">
                              <span
                                className="inline-block h-3.5 w-28 bg-zinc-400/30 dark:bg-zinc-600/50 rounded-sm select-none"
                                title="Colaborador ocultado"
                              />
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-foreground truncate">
                              {idea.authorName}
                              {idea.authorSector && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  · {idea.authorSector}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-[11px] text-muted-foreground">
                            enviada há{" "}
                            {formatDistanceToNow(new Date(idea.createdAt), {
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10.5px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-muted/40 text-muted-foreground border-border/60 shrink-0">
                        {statusLabel}
                        </span>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-bold text-sm text-foreground line-clamp-2">
                        {idea.problem ?? idea.description}
                      </h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {idea.description}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="flex items-center gap-1.5 font-semibold text-foreground/80">
                          <ThumbsUp className={cn("w-3.5 h-3.5", idea.hasSupported ? "text-primary fill-primary" : "")} />
                          {idea.supportsCount} apoios
                        </span>

                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {idea.commentsCount} comentários
                        </span>
                      </div>

                      {!isInactive && (
                        <button
                          onClick={() => onOpenIdeaDetail(idea.id)}
                          className="font-bold hover:underline text-xs text-primary flex items-center gap-1 sm:ml-auto cursor-pointer group-hover:translate-x-0.5 transition-transform"
                        >
                          Ver ideia completa →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40 text-xs text-muted-foreground">
              <span>
                Página <b>{currentPage}</b> de <b>{totalPages}</b>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Anterior
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}