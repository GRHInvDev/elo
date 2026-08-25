"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Calendar, MapPin, Sparkles, DoorClosed } from "lucide-react"

import { RoomMap } from "@/components/rooms/room-map"
import { RoomScheduleCompact } from "@/components/rooms/room-schedule-compact"
import { AvailableRooms } from "@/components/rooms/avalible-rooms"
import { MyBookings } from "@/components/birthday/my-bookings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Coordinates, type Room } from "@/types/room"
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"

export function RoomsClient() {
  const { data: filiaisData = [], isLoading: isLoadingFiliais } = api.filiais.list.useQuery()

  const roomFiliais = useMemo(
    () =>
      filiaisData
        .filter((f) => f.hasRoom)
        .sort((a, b) => {
          if (a.code.toUpperCase() === "SCS") return -1
          if (b.code.toUpperCase() === "SCS") return 1
          return a.code.localeCompare(b.code)
        }),
    [filiaisData],
  )


  const defaultFilialCode = useMemo(() => {
    return (
      roomFiliais.find((f) => f.code.toUpperCase() === "SCS")?.code ??
      roomFiliais[0]?.code ??
      ""
    )
  }, [roomFiliais])

  const [filial, setFilial] = useState<string>("")
  const [sidebarTab, setSidebarTab] = useState<string>("available")

  useEffect(() => {
    if (roomFiliais.length > 0 && (!filial || !roomFiliais.some((f) => f.code === filial))) {
      setFilial(defaultFilialCode)
    }
  }, [roomFiliais, filial, defaultFilialCode])

  const activeFilial = filial || defaultFilialCode

  const { data: rawRooms } = api.room.list.useQuery(
    { filial: activeFilial },
    { enabled: Boolean(activeFilial) },
  )
  const { data: myBookings = [] } = api.booking.listMine.useQuery()

  const rooms: Room[] = (rawRooms ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    capacity: r.capacity,
    floor: r.floor,
    filial: (r as { filial?: string }).filial ?? activeFilial,
    photos: r.photos ?? [],
    visualModel: r.visualModel ?? undefined,
    coordinates: r.coordinates as unknown as Coordinates,
    bookings: r.bookings ?? [],
  }))

  const filteredMyBookings = myBookings.filter(
    (b) => !activeFilial || b.room.filial === activeFilial,
  )

  if (!isLoadingFiliais && roomFiliais.length === 0) {
    return (
      <div className="space-y-6 min-w-0 max-w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
            Reserva de Salas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Nenhuma unidade cadastrada possui o recurso de salas habilitado.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4 border rounded-2xl bg-card text-center">
          <DoorClosed className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold">Nenhuma filial com salas habilitadas</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Para utilizar o módulo de reserva de salas, acesse a gestão de filiais e habilite a opção
            &quot;Permite cadastro de salas&quot; na filial desejada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
            Reserva de Salas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Selecione a filial, navegue pelos andares e agende reuniões em tempo real
          </p>
        </div>

        {roomFiliais.length > 0 && (
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/60 gap-1 self-start sm:self-auto shadow-xs max-w-full overflow-x-auto scrollbar-hide">
            <span className="text-xs font-semibold text-muted-foreground px-2 flex items-center gap-1 shrink-0">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Unidade:
            </span>
            {roomFiliais.map((opt) => {
              const isSelected = activeFilial === opt.code
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFilial(opt.code)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm scale-102"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                  )}
                >
                  {opt.code}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 min-w-0">
        <div className="space-y-6 lg:col-span-8 min-w-0">
          <RoomMap filial={activeFilial} />
          <RoomScheduleCompact filial={activeFilial} rooms={rooms} />
        </div>

        <div className="space-y-4 lg:col-span-4 min-w-0">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="space-y-3">
            <TabsList className="grid grid-cols-2 w-full h-9 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="available" className="text-xs font-medium rounded-lg gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Livres Agora
              </TabsTrigger>
              <TabsTrigger value="my-bookings" className="text-xs font-medium rounded-lg gap-1.5">
                <Calendar className="size-3.5" />
                Minhas ({filteredMyBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="mt-0 space-y-3 min-w-0">
              <AvailableRooms filial={filial} />
            </TabsContent>

            <TabsContent value="my-bookings" className="mt-0 space-y-3 min-w-0">
              <MyBookings filial={filial} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}