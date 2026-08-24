"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { Users, Layers, MapPin, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IsometricRoomCanvas } from "./isometric-room-canvas"
import { type IsometricRoomModel } from "@/types/isometric-room"

export interface RoomWithBookings {
  id: string
  name: string
  description?: string | null
  capacity: number
  floor: number
  filial: string
  photos?: string[]
  visualModel: IsometricRoomModel
  bookings?: {
    id: string
    title: string
    start: Date
    end: Date
  }[]
}

interface RoomGalleryCardProps {
  room: RoomWithBookings
  onBook: (room: RoomWithBookings) => void
}

export function RoomGalleryCard({ room, onBook }: RoomGalleryCardProps) {
  const currentBooking = useMemo(() => {
    const now = new Date()
    return room.bookings?.find((b) => {
      const start = new Date(b.start)
      const end = new Date(b.end)
      return now >= start && now <= end
    })
  }, [room.bookings])

  const isAvailable = !currentBooking

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-md transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full">
        <div className="absolute -top-24 -right-24 size-48 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 opacity-40 group-hover:opacity-80" />

        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-b from-muted/30 to-background/90 border-b border-border/40 p-2 flex items-center justify-center">
          <IsometricRoomCanvas
            model={room.visualModel}
            highlightStatus={isAvailable ? "available" : "occupied"}
            interactive={true}
          />

          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <Badge
              variant="outline"
              className="bg-background/80 backdrop-blur-md border-border/60 text-xs font-medium gap-1 text-foreground"
            >
              <Layers className="size-3 text-primary" />
              {room.floor}º Andar
            </Badge>
            <Badge
              variant="outline"
              className="bg-background/80 backdrop-blur-md border-border/60 text-xs font-medium gap-1 text-muted-foreground"
            >
              <MapPin className="size-3 text-primary" />
              {room.filial}
            </Badge>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {room.name}
                </h3>
                {room.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {room.description}
                  </p>
                )}
              </div>

              {isAvailable ? (
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="size-3" />
                  Livre
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                  <XCircle className="size-3" />
                  Ocupada
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground/80 border border-border/40">
                <Users className="size-3 text-primary" />
                Até {room.capacity} pessoas
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {currentBooking ? (
                <span>
                  Ocupada até{" "}
                  <strong className="text-foreground">
                    {new Date(currentBooking.end).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </span>
              ) : (
                <span className="text-emerald-500/90 font-medium">Disponível para reserva</span>
              )}
            </span>

            <Button
              size="sm"
              className="rounded-xl gap-1.5 shadow-sm font-medium transition-all"
              onClick={() => onBook(room)}
            >
              <Calendar className="size-3.5" />
              Reservar
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
