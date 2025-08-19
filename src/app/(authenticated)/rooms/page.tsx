import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard-shell"
import { RoomsClient } from "./_components/rooms-client"

export const metadata: Metadata = {
  title: "Salas | elo",
  description: "Agendamento de salas de reunião",
}

export default function RoomsPage() {
  return (
    <DashboardShell>
      <RoomsClient />
    </DashboardShell>
  )
}