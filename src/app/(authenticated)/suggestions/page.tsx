"use client"

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/trpc/react"
import {
  Lightbulb,
  Check,
  Lock,
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MyIdeasModal } from "@/components/collaborator/suggestion/my-ideas-modal"
import { CampaignWinnersModal } from "@/components/collaborator/suggestion/campaign-winners-modal"
import { IdeaExpandedModal } from "@/components/collaborator/suggestion/idea-expanded-modal"
import { CampaignView } from "@/components/collaborator/suggestion/campaign-view"
import { SuggestionsModal } from "@/components/admin/suggestion/suggestion-card"

export default function MySuggestionsPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

  const [isMyIdeasOpen, setIsMyIdeasOpen] = useState(false)
  const [selectedClosedCampaignId, setSelectedClosedCampaignId] = useState<string | null>(null)
  const [selectedIdeaDetailId, setSelectedIdeaDetailId] = useState<string | null>(null)
  const [isNewIdeaModalOpen, setIsNewIdeaModalOpen] = useState(false)
  const [newIdeaCampaignId, setNewIdeaCampaignId] = useState<string | null>(null)
  const [isNewIdeaCampaignPrivate, setIsNewIdeaCampaignPrivate] = useState(false)

  const { data: myIdeas = [] } = api.suggestion.listMyIdeas.useQuery()

  const { data: activeCampaigns = [], isLoading: isLoadingActive } =
    api.campaign.listPublicActive.useQuery()

  const { data: closedCampaigns = [], isLoading: isLoadingClosed } =
    api.campaign.listClosed.useQuery()

  const handleOpenNewIdea = (campaignId?: string | null, isPrivate = false) => {
    setNewIdeaCampaignId(campaignId ?? null)
    setIsNewIdeaCampaignPrivate(isPrivate)
    setIsNewIdeaModalOpen(true)
  }

  if (selectedCampaignId) {
    return (
      <div className="max-w-[1440px] mx-auto p-3 sm:p-6 md:p-8 space-y-6">
        <CampaignView
          campaignId={selectedCampaignId}
          onBack={() => setSelectedCampaignId(null)}
          onNewIdea={(cId, isPriv) => handleOpenNewIdea(cId, isPriv)}
          onOpenIdeaDetail={(ideaId) => setSelectedIdeaDetailId(ideaId)}
          onOpenMyIdeas={() => setIsMyIdeasOpen(true)}
        />

        <MyIdeasModal
          isOpen={isMyIdeasOpen}
          onClose={() => setIsMyIdeasOpen(false)}
          onOpenIdeaDetail={(ideaId) => setSelectedIdeaDetailId(ideaId)}
        />

        <CampaignWinnersModal
          campaignId={selectedClosedCampaignId}
          isOpen={Boolean(selectedClosedCampaignId)}
          onClose={() => setSelectedClosedCampaignId(null)}
          onOpenIdeaDetail={(ideaId) => setSelectedIdeaDetailId(ideaId)}
        />

        <IdeaExpandedModal
          ideaId={selectedIdeaDetailId}
          isOpen={Boolean(selectedIdeaDetailId)}
          onClose={() => setSelectedIdeaDetailId(null)}
        />

        <SuggestionsModal
          isOpen={isNewIdeaModalOpen}
          onOpenChange={setIsNewIdeaModalOpen}
          campaignId={newIdeaCampaignId}
          isCampaignPrivate={isNewIdeaCampaignPrivate}
        />
      </div>
    )
  }

  return (
    <div className="max-w-[1440px] mx-auto p-3 sm:p-6 md:p-8 space-y-7 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            Ideias & Campanhas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Explore as campanhas abertas ou acompanhe o status das suas ideias publicadas.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setIsMyIdeasOpen(true)}
            variant="outline"
            className="rounded-xl border-border/80 hover:bg-muted/60 text-xs sm:text-sm font-semibold h-9 sm:h-10 px-3.5 sm:px-4 gap-2 shadow-xs cursor-pointer"
          >
            <span>Minhas ideias</span>
            {myIdeas.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold rounded-full ml-0.5">
                {myIdeas.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Campanhas ativas
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            {activeCampaigns.length} abertas para participação
          </span>
        </div>

        {isLoadingActive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-card/60 space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : activeCampaigns.length === 0 ? (
          <div className="py-12 sm:py-14 text-center text-muted-foreground space-y-2 border border-dashed rounded-2xl bg-card/20 px-4">
            <Lightbulb className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-sm font-medium">Nenhuma campanha ativa no momento.</p>
            <p className="text-xs text-muted-foreground/70">
              Novas campanhas de inovação serão publicadas em breve!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCampaigns.map((campaign) => {
              const daysLeft = Math.max(
                0,
                differenceInDays(new Date(campaign.endDate), new Date())
              )

              return (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-border/80 bg-card/80 dark:bg-[#131518] hover:border-border transition-all p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-sm group"
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground mb-1 flex items-center gap-2">
                        {campaign.isPrivate && (
                          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className="line-clamp-1">{campaign.name}</span>
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[36px] sm:min-h-[40px]">
                        {campaign.objective}
                      </p>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-muted/50 dark:bg-[#20242c] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r dark:from-[#000000] dark:via-[#656565] dark:to-[#ffffff] from-[#ffffff] via-[#656565] to-[#000000] transition-all duration-500"
                        style={{
                          width: `${Math.min(95, Math.max(15, 100 - (daysLeft * 5)))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                      <span>{campaign.ideasCount} ideias enviadas</span>
                      <span className="text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-0.5 rounded-full">
                        {daysLeft} dias restantes
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 font-bold h-10 rounded-xl text-xs transition-all flex items-center justify-center shadow-sm cursor-pointer"
                  >
                    Participar
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          Resultados de campanhas encerradas
        </h2>

        {isLoadingClosed ? (
          <div className="p-4 rounded-2xl border border-border/60 bg-card/40 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : closedCampaigns.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground border rounded-2xl bg-card/20">
            Nenhuma campanha encerrada com histórico recente.
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-card/80 dark:bg-[#131518] overflow-hidden divide-y divide-border/60 shadow-sm">
            {closedCampaigns.map((closed) => (
              <div
                key={closed.id}
                onClick={() => setSelectedClosedCampaignId(closed.id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 hover:bg-muted/20 cursor-pointer transition-all gap-2.5 sm:gap-4"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0 stroke-[2.5]" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground hover:text-emerald-400 transition-colors">
                      {closed.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Encerrada em {format(new Date(closed.endDate), "dd 'de' MMM.", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 text-xs text-muted-foreground shrink-0 pl-7 sm:pl-0">
                  <div>
                    <span>Ideias </span>
                    <b className="text-foreground font-bold">{closed.ideasCount}</b>
                  </div>
                  <div>
                    <span>Implementadas </span>
                    <b className="text-emerald-400 font-bold">{closed.implementedCount}</b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MyIdeasModal
        isOpen={isMyIdeasOpen}
        onClose={() => setIsMyIdeasOpen(false)}
        onOpenIdeaDetail={(ideaId) => setSelectedIdeaDetailId(ideaId)}
      />

      <CampaignWinnersModal
        campaignId={selectedClosedCampaignId}
        isOpen={Boolean(selectedClosedCampaignId)}
        onClose={() => setSelectedClosedCampaignId(null)}
        onOpenIdeaDetail={(ideaId) => setSelectedIdeaDetailId(ideaId)}
      />

      <IdeaExpandedModal
        ideaId={selectedIdeaDetailId}
        isOpen={Boolean(selectedIdeaDetailId)}
        onClose={() => setSelectedIdeaDetailId(null)}
      />

      <SuggestionsModal
        isOpen={isNewIdeaModalOpen}
        onOpenChange={setIsNewIdeaModalOpen}
        campaignId={newIdeaCampaignId}
        isCampaignPrivate={isNewIdeaCampaignPrivate}
      />
    </div>
  )
}