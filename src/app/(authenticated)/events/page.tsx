import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { canViewEvents, canCreateEvent } from "@/lib/access-control"

export const metadata: Metadata = {
  title: "Eventos | elo",
  description: "Eventos da empresa",
}

//Aguardar no momento, pagina desabilitada
export default async function EventsPage() {
  let user;

  try {
    user = await currentUser();
  } catch (error) {
    console.warn('[EventsPage] Erro ao obter usuário:', error instanceof Error ? error.message : 'Erro desconhecido');
    redirect("/sign-in?redirect_url=/events");
  }

  if (!user) {
    redirect("/sign-in?redirect_url=/events")
  }

  // Redireciona enquanto o módulo de eventos estiver temporariamente desabilitado
  redirect("/news")

  /*
  // Buscar dados do usuário para verificar permissões de criação
  const userData = await api.user.me()

  if (userData.role_config?.isTotem) {
    redirect("/dashboard")
  }

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
  */
}

