"use client"

import { useState } from "react"
import { Users, Layers, CalendarPlus, DoorClosed } from "lucide-react"

import { api } from "@/trpc/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RoomDialog } from "./room-dialog"
import type { Room } from "@/types/room"

export function AvailableRooms({ className = "", filial }: { className?: string; filial?: string }) {
  const [now] = useState(new Date())
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const { data: rooms, isLoading } = api.room.listAvailable.useQuery({ date: now, filial })

  if (isLoading) {
    return (
      <Card className={`rounded-2xl border-border/60 ${className}`}>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Salas Disponíveis Agora</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
            </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={`rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xs overflow-hidden ${className}`}>
        <CardContent className="p-3">
          {!rooms || rooms.length === 0 ? (
            <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2">
              <div className="size-10 rounded-full bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground/60">
                <DoorClosed className="size-5" />
              </div>
              <p className="text-xs font-medium text-foreground">Nenhuma sala livre no momento</p>
              <p className="text-[11px] text-muted-foreground max-w-[220px]">
                Todas as salas desta filial estão ocupadas ou reservadas agora.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5 scrollbar-hide">
              {rooms.map((room) => {
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoom(room as unknown as Room)}
                    className="w-full text-left p-3 rounded-xl border border-border/40 bg-background/60 hover:bg-muted/30 hover:border-primary/40 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col gap-2 min-w-0"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate min-w-0 flex-1">
                        {room.name}
                      </p>
                      <span className="shrink-0 inline-flex items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors px-2 py-0.5 rounded-lg">
                        <CalendarPlus className="size-5" />
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3 text-muted-foreground/70" />
                        {room.capacity} {room.capacity === 1 ? "pessoa" : "pessoas"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="size-3 text-muted-foreground/70" />
                        {room.floor}º andar
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Agendamento da Sala Selecionada */}
      {selectedRoom && (
        <RoomDialog
          room={selectedRoom}
          open={Boolean(selectedRoom)}
          onOpenChange={(open) => !open && setSelectedRoom(null)}
        />
      )}
    </>
  )
}
