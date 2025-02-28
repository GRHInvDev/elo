import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard-shell"
import { RoomMap } from "@/components/room-map"
import { RoomCalendar } from "@/components/room-calendar"
import { AvailableRooms } from "@/components/avalible-rooms"

export const metadata: Metadata = {
  title: "Salas | elo",
  description: "Agendamento de salas de reunião",
}

export default function RoomsPage() {
  return (
    <DashboardShell>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RoomMap className="col-span-4" />
        <div className="col-span-3 space-y-4">
          <AvailableRooms />
          <RoomCalendar />
        </div>
      </div>
    </DashboardShell>
  )
}

