"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import Link from "next/link"
import { Users } from "lucide-react"

import { api } from "@/trpc/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { boostAvatarUrl } from "@/lib/boost-avatar-url"
import { cn } from "@/lib/utils"

function NewUsersHallListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Carregando lista do Hall">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md border border-transparent p-3"
        >
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 max-w-[200px] w-3/5" />
            <Skeleton className="h-3 max-w-[140px] w-2/5" />
            <Skeleton className="h-3 max-w-[120px] w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function NewUsersHallHighlightsSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      aria-busy="true"
      aria-label="Carregando destaques do Hall"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="flex flex-col items-center rounded-xl border p-6">
          <Skeleton className="h-56 w-56 shrink-0 rounded-full sm:h-64 sm:w-64 md:h-72 md:w-72" />
          <Skeleton className="mt-4 h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-28" />
          <Skeleton className="mt-2 h-3 w-36" />
        </div>
      ))}
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

const HIGHLIGHT_IMAGE_SIZES =
  "(max-width: 640px) min(100vw - 3rem, 14rem), (max-width: 1024px) 16rem, 18rem"

function HallHighlightPortrait({
  name,
  imageUrl,
}: {
  name: string
  imageUrl: string | null
}) {
  const [failed, setFailed] = useState(false)
  const boosted = imageUrl ? boostAvatarUrl(imageUrl) : null
  const showImage = Boolean(boosted && !failed)

  useEffect(() => {
    setFailed(false)
  }, [imageUrl])

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/25 ring-offset-2 ring-offset-background",
        "h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72",
      )}
    >
      {showImage ? (
        <Image
          src={boosted!}
          alt={name}
          fill
          className="object-cover bg-white"
          sizes={HIGHLIGHT_IMAGE_SIZES}
          quality={95}
          priority={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xl font-medium sm:text-2xl md:text-3xl">
          {getInitials(name)}
        </div>
      )}
    </div>
  )
}

export function NewUsersHallContent({ canManage }: { canManage?: boolean }) {
  const { data: publishedList, isLoading: loadingPub } = api.newUsersHall.listPublished.useQuery()

  const { highlights, others } = useMemo(() => {
    const list = publishedList ?? []
    return {
      highlights: list.filter((r) => r.isHighlight),
      others: list.filter((r) => !r.isHighlight),
    }
  }, [publishedList])

  const isEmpty = (publishedList ?? []).length === 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Novos colaboradores</CardTitle>
              <CardDescription>
                Conheça quem está chegando na equipe!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {loadingPub ? (
            <div className="space-y-8">
              <NewUsersHallHighlightsSkeleton />
              <NewUsersHallListSkeleton rows={3} />
            </div>
          ) : isEmpty ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum colaborador publicado no Hall no momento.
            </p>
          ) : (
            <>
              {highlights.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span>Destaques</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {highlights.map((row) => (
                      <div
                        key={row.id}
                        className={cn(
                          "flex flex-col items-center rounded-xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-6 text-center shadow-sm",
                          "transition-colors hover:border-primary/35",
                        )}
                      >
                        <HallHighlightPortrait name={row.name} imageUrl={row.effectiveImageUrl} />
                        <p className="mt-4 text-base font-semibold leading-tight">{row.name}</p>
                        {row.setor ? (
                          <p className="mt-1 text-sm text-muted-foreground">{row.setor}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(row.createdAt), "d 'de' MMMM yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {others.length > 0 ? (
                <div className="space-y-2">
                  {highlights.length > 0 ? (
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Demais colaboradores
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    {others.map((row) => (
                      <div
                        key={row.id}
                        className={cn(
                          "flex items-center gap-3 rounded-md border border-transparent p-3 transition-colors",
                          "hover:bg-muted/50",
                        )}
                      >
                        <Avatar className="h-12 w-12 shrink-0">
                          {row.effectiveImageUrl ? (
                            <AvatarImage
                              src={row.effectiveImageUrl}
                              alt={row.name}
                              className="object-cover bg-white"
                            />
                          ) : null}
                          <AvatarFallback className="text-xs">{getInitials(row.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight truncate">{row.name}</p>
                          {row.setor ? (
                            <p className="text-xs text-muted-foreground truncate">{row.setor}</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(row.createdAt), "d 'de' MMMM yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
