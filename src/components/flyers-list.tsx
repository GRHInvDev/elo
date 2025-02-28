"use client"

import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { api } from "@/trpc/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function FlyersList() {
  const { data: flyers, isLoading } = api.flyer.list.useQuery()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-video w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!flyers?.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">Nenhum encarte encontrado</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">Não há encartes publicados no momento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {flyers.map((flyer) => (
        <Card key={flyer.id}>
          <CardHeader>
            <div className="space-y-1">
              <h3 className="font-semibold">{flyer.title}</h3>
              <p className="text-sm text-muted-foreground">
                Publicado em {format(flyer.createdAt, "PP", { locale: ptBR })}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video overflow-hidden rounded-md">
              <Image src={flyer.imageUrl || "/placeholder.svg"} alt={flyer.title} fill className="object-cover" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{flyer.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
