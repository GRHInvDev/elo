import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"

import { DashboardShell } from "@/components/dashboard-shell"
import { EventsList } from "@/components/events-list"
import { CreateEventButton } from "@/components/create-event-button"
import { api } from "@/trpc/server"
import { canViewEvents, canCreateEvent } from "@/lib/access-control"

export const metadata: Metadata = {
  title: "Eventos | elo",
  description: "Eventos da empresa",
}

export default async function EventsPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in?redirect_url=/events")
  }

  // Buscar dados do usuário para verificar permissões
  const userData = await api.user.me()

  // Verificar se o usuário tem permissão para visualizar a página de eventos
  if (!canViewEvents()) {
    redirect("/dashboard")
  }

  // Verificar se o usuário tem permissão para criar eventos
  const canCreate = canCreateEvent(userData.role_config)

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
          <p className="text-muted-foreground">
            {canCreate 
              ? "Confira os próximos eventos da empresa e crie novos eventos" 
              : "Confira os próximos eventos da empresa"
            }
          </p>
        </div>
        {canCreate && <CreateEventButton />}
      </div>
      <EventsList />
    </DashboardShell>
  )
}

