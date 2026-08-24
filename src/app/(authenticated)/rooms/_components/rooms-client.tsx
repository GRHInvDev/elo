"use client"

import React, { useState } from "react"
import { MapPin } from "lucide-react"

import { RoomMap } from "@/components/rooms/room-map"
import { RoomScheduleCompact } from "@/components/rooms/room-schedule-compact"
import { AvailableRooms } from "@/components/rooms/avalible-rooms"
import { MyBookings } from "@/components/birthday/my-bookings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FILIAIS, type Coordinates, type Room } from "@/types/room"
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"

export function RoomsClient() {
  const [filial, setFilial] = useState<string>("SCS")
  const [sidebarTab, setSidebarTab] = useState<string>("available")

  // Carrega lista de salas da filial selecionada para repassar aos componentes
  const { data: rawRooms } = api.room.list.useQuery({ filial })
  const { data: myBookings = [] } = api.booking.listMine.useQuery()

  const rooms: Room[] = (rawRooms ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    capacity: r.capacity,
    floor: r.floor,
    filial: (r as { filial?: string }).filial ?? filial,
    coordinates: r.coordinates as unknown as Coordinates,
    bookings: r.bookings ?? [],
  }))

  const filteredMyBookings = myBookings.filter(
    (b) => !filial || b.room.filial === filial,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Reserva de Salas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Selecione a filial, navegue pelos andares e agende reuniões em tempo real
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-muted/60 border gap-1 self-start sm:self-auto">
          <span className="text-xs font-semibold text-muted-foreground px-2.5 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Unidade:
          </span>
          {FILIAIS.map((opt) => {
            const isSelected = filial === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setFilial(opt)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm scale-102"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                )}
              >
                Filial {opt}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <RoomMap filial={filial} />
          <RoomScheduleCompact filial={filial} rooms={rooms} />
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="space-y-3">
            <TabsList className="grid grid-cols-2 w-full h-9">
              <TabsTrigger value="available" className="text-xs">
                Livres Agora
              </TabsTrigger>
              <TabsTrigger value="my-bookings" className="text-xs">
                Minhas Reservas ({filteredMyBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="mt-0">
              <AvailableRooms filial={filial} />
            </TabsContent>

            <TabsContent value="my-bookings" className="mt-0">
              <MyBookings filial={filial} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}