import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard-shell"
import { RoomMap } from "@/components/room-map"
import { RoomsList } from "@/components/rooms-list"

export const metadata: Metadata = {
  title: "Salas | Intranet",
  description: "Agendamento de salas de reunião",
}

export default function RoomsPage() {
  return (
    <DashboardShell>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RoomMap className="col-span-4" />
        <RoomsList className="col-span-3" />
      </div>
    </DashboardShell>
  )
}

