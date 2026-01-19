"use client"

import { useEffect, useState } from "react"
import { RoomMap } from "@/components/rooms/room-map"
import { RoomCalendar } from "@/components/rooms/room-calendar"
import { AvailableRooms } from "@/components/rooms/avalible-rooms"
import { MyBookings } from "@/components/birthday/my-bookings"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const FILIAIS = ["SCS", "CAC", "VA"]

export function RoomsClient() {
  const [filial, setFilial] = useState<string>("SCS")

  useEffect(() => {
    setFilial((prev) => prev || "SCS")
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar por filial:</span>
        <Select value={filial} onValueChange={setFilial}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione a filial" />
          </SelectTrigger>
          <SelectContent>
            {FILIAIS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <div className="space-y-4 col-span-1 md:col-span-4">
          <RoomMap filial={filial} />
          <MyBookings filial={filial} />
        </div>

        <div className="md:col-span-3 col-span-1 space-y-4">
          <AvailableRooms filial={filial} />
          <RoomCalendar filial={filial} />
        </div>
      </div>
    </div>
  )
}