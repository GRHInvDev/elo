"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Users } from "lucide-react"

import { api } from "@/trpc/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export function NewUsersHallContent({ canManage }: { canManage?: boolean }) {
  const { data: publishedList, isLoading: loadingPub } = api.newUsersHall.listPublished.useQuery()

  const displayList = publishedList ?? []

  return (
    <div className="space-y-6">
      {canManage ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/hall-entrada">Gerenciar no painel Admin</Link>
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Hall de entrada</CardTitle>
              <CardDescription>
                Conheça quem está chegando na equipe!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPub ? (
            <NewUsersHallListSkeleton />
          ) : displayList.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum colaborador publicado no Hall no momento.
            </p>
          ) : (
            <div className="space-y-2">
              {displayList.map((row) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
