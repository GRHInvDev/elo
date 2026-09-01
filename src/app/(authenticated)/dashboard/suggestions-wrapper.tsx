"use client"

import Link from "next/link"
import { Lock, ChevronRight } from "lucide-react"
import { differenceInDays } from "date-fns"
import { api } from "@/trpc/react"
import { Skeleton } from "@/components/ui/skeleton"

export function SuggestionsWrapper() {
  const { data: userData } = api.user.me.useQuery()
  const isTotem = userData?.role_config?.isTotem === true

  const { data: activeCampaigns = [], isLoading } =
    api.campaign.listPublicActive.useQuery(undefined, {
      enabled: !isTotem,
    })

  // Não exibir nada para usuários Totem
  if (isTotem) {
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    )
  }

  if (activeCampaigns.length === 0) {
    return (
      <div className="py-6 px-3 text-center text-xs md:text-sm text-muted-foreground font-medium rounded-lg bg-background/50 border border-dashed">
        Nenhuma campanha vigente no momento
      </div>
    )
  }

  const isScrollable = activeCampaigns.length > 2

  return (
    <div
      className={`space-y-2 ${
        isScrollable
          ? "max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 scrollbar-hide"
          : ""
      }`}
    >
      {activeCampaigns.map((campaign) => {
        const daysLeft = Math.max(
          0,
          differenceInDays(new Date(campaign.endDate), new Date())
        )

        return (
          <Link
            key={campaign.id}
            href={`/suggestions?campaignId=${campaign.id}`}
            className="group block rounded-lg bg-background/50 p-3 transition-all hover:bg-background/80 hover:shadow-sm active:scale-[0.99] border border-transparent hover:border-border/60"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-foreground">
                  {campaign.isPrivate && (
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="truncate group-hover:text-primary transition-colors">
                    {campaign.name}
                  </span>
                </div>
                {campaign.objective && (
                  <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed truncate">
                    {campaign.objective}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-1 text-[10px] sm:text-[11px] text-muted-foreground font-medium">
                  <span>
                    {campaign.ideasCount}{" "}
                    {campaign.ideasCount === 1 ? "ideia" : "ideias"}
                  </span>
                  <span>•</span>
                  <span>
                    {daysLeft} {daysLeft === 1 ? "dia restante" : "dias restantes"}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
