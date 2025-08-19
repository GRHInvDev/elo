"use client"

import { useState } from "react"
import { Check } from "lucide-react"

import { api } from "@/trpc/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AvailableRooms({ className, filial }: { className?: string; filial?: string }) {
  const [now] = useState(new Date())
  const { data: rooms, isLoading } = api.room.listAvailable.useQuery({ date: now, filial })
  const filtered = rooms?.filter((r) => !filial || (r as { filial?: string }).filial === filial)
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Salas Disponíveis Agora</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            Salas Disponíveis Agora:
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {!rooms?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma sala disponível no momento.</p>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {room.capacity} pessoas • {room.floor}º andar
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

