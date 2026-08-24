"use client"

import React, { useState } from "react"
import { Calendar, DoorClosed, Users } from "lucide-react"

import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Coordinates, Room } from "@/types/room"
import { RoomDialog } from "./room-dialog"

export function AvailableRooms({ className = "", filial }: { className?: string; filial?: string }) {
  const [now] = useState(new Date())
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: rawRooms, isLoading } = api.room.listAvailable.useQuery({ date: now, filial })

  const rooms: Room[] = (rawRooms ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    capacity: r.capacity,
    floor: r.floor,
    filial: (r as { filial?: string }).filial ?? "SCS",
    coordinates: r.coordinates as unknown as Coordinates,
  }))

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room)
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Salas Livres Agora</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-full w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <CardTitle className="text-sm font-semibold">Salas Livres Agora</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-1">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <DoorClosed className="h-8 w-8 mb-1.5 opacity-40" />
              <p className="text-xs font-medium">Todas as salas estão ocupadas no momento.</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Consulte o calendário para horários futuros.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto scrollbar-hide">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-all gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-xs text-foreground truncate">{room.name}</p>
                      <Badge variant="outline" className="text-[10px] py-0 font-mono">
                        {room.floor}º Andar
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {room.capacity}
                      </span>
                      {room.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{room.description}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2 gap-1 shrink-0"
                    onClick={() => handleBookRoom(room)}
                  >
                    <Calendar className="h-3 w-3 text-primary" />
                    Reservar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RoomDialog
        room={selectedRoom}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}
