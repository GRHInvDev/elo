import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard-shell"
import { RoomMap } from "@/components/room-map"
import { RoomCalendar } from "@/components/room-calendar"
import { AvailableRooms } from "@/components/avalible-rooms"
import { MyBookings } from "@/components/my-bookings"

export const metadata: Metadata = {
  title: "Salas | elo",
  description: "Agendamento de salas de reunião",
}

export default function RoomsPage() {
  return (
    <DashboardShell>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <div className="space-y-4 col-span-1 md:col-span-4">
          <RoomMap />
          <MyBookings/>
        </div>

        <div className="md:col-span-3 col-span-1 space-y-4">
          <AvailableRooms />
          <RoomCalendar />
        </div>
      </div>
    </DashboardShell>
  )
}

