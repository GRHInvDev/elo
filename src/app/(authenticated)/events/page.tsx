import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard-shell"
import { EventsList } from "@/components/events-list"
import { CreateEventButton } from "@/components/create-event-button"

export const metadata: Metadata = {
  title: "Eventos | elo",
  description: "Eventos da empresa",
}

export default function EventsPage() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
          <p className="text-muted-foreground">Confira os próximos eventos da empresa</p>
        </div>
        <CreateEventButton />
      </div>
      <EventsList />
    </DashboardShell>
  )
}

