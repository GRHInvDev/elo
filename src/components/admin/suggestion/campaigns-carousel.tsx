"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Clock, Lock } from "lucide-react"
import { formatDistanceToNow, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CampaignItem {
  id: string
  name: string
  objective: string
  startDate: Date
  endDate: Date
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  isPrivate: boolean
  ideasCount: number
  participantsCount: number
  implementedCount: number
}

interface CampaignsCarouselProps {
  campaigns: CampaignItem[]
  isLoading?: boolean
  selectedCampaignId?: string | null
  onSelectCampaignFilter?: (campaignId: string | null) => void
  onOpenCreateCampaign: () => void
  onOpenManageCampaign: (campaignId: string) => void
}

export function CampaignsCarousel({
  campaigns,
  isLoading = false,
  selectedCampaignId,
  onSelectCampaignFilter,
  onOpenCreateCampaign,
  onOpenManageCampaign,
}: CampaignsCarouselProps) {
  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const order = { ACTIVE: 0, DRAFT: 1, CLOSED: 2 }
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status]
      }
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    })
  }, [campaigns])

  const getDaysLeftText = (campaign: CampaignItem) => {
    const today = new Date()
    const end = new Date(campaign.endDate)

    if (campaign.status === "CLOSED") {
      return `Encerrou ${formatDistanceToNow(end, { addSuffix: false, locale: ptBR })}`
    }
    if (campaign.status === "DRAFT") {
      return `Inicia em ${new Date(campaign.startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
    }

    const days = differenceInDays(end, today)
    if (days < 0) return "Prazo encerrado"
    if (days === 0) return "Último dia"
    return `${days}d restantes`
  }

  return (
    <div className="mb-6 rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm w-full min-w-0 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            Campanhas vigentes
            {selectedCampaignId && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border border-primary/20">
                Filtrando no Kanban
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedCampaignId && onSelectCampaignFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectCampaignFilter(null)}
              className="text-xs text-muted-foreground hover:text-foreground h-8"
            >
              Ver todas as ideias
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onOpenCreateCampaign}
            className="h-8 text-xs font-semibold flex items-center gap-1.5 bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova campanha
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 w-full min-w-0 max-w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 w-72 rounded-xl border bg-muted/40 animate-pulse shrink-0" />
          ))}
        </div>
      ) : sortedCampaigns.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-xl p-6 text-muted-foreground">
          <p className="text-sm font-medium">Nenhuma campanha cadastrada ainda.</p>
          <p className="text-xs mt-1">Clique em &quot;Nova campanha&quot; para criar o primeiro desafio de ideias.</p>
        </div>
      ) : (
        <div className="flex gap-3.5 overflow-x-auto pb-2 pt-1 scrollbar-thin w-full min-w-0 max-w-full">
          {sortedCampaigns.map((camp) => {
            const isFiltered = selectedCampaignId === camp.id

            return (
              <div
                key={camp.id}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all shrink-0 w-72 h-[156px] ${
                  isFiltered
                    ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                    : camp.status === "ACTIVE"
                    ? "border-border/80 bg-card hover:border-border hover:shadow-md"
                    : "border-border/50 bg-muted/20 opacity-85 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        camp.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : camp.status === "DRAFT"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {camp.status === "ACTIVE" ? "Ativa" : camp.status === "DRAFT" ? "Rascunho" : "Encerrada"}
                    </span>
                    {camp.isPrivate && (
                      <span className="text-[10px] text-amber-400/90 flex items-center" title="Campanha privada">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {camp.status !== "CLOSED" && (
                    <span className="text-[11.5px] text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground/70" />
                      {getDaysLeftText(camp)}
                    </span>
                  )}
                </div>

                <div className="my-1.5">
                  <div className="font-bold text-sm text-foreground line-clamp-1 leading-snug" title={camp.name}>
                    {camp.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {camp.ideasCount} ideias · {camp.participantsCount} participantes
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7 font-medium border-border/80 hover:bg-muted"
                    onClick={() => onOpenManageCampaign(camp.id)}
                  >
                    Gerenciar campanha →
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
