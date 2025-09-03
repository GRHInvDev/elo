import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { DashboardShell } from "@/components/dashboard-shell"
import { FlyersList } from "@/components/flyers-list"
import { CreateFlyerButton } from "@/components/create-flyer-button"
import { api } from "@/trpc/server"
import { canViewFlyers, canCreateFlyer } from "@/lib/access-control"

export const metadata: Metadata = {
  title: "Encartes | elo",
  description: "Encartes da empresa",
}

export default async function FlyersPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in?redirect_url=/flyers")
  }

  // Buscar dados do usuário para verificar permissões
  const userData = await api.user.me()

  // Verificar se o usuário tem permissão para visualizar a página de encartes
  if (!canViewFlyers(userData.role_config)) {
    redirect("/dashboard")
  }

  // Verificar se o usuário tem permissão para criar encartes
  const canCreate = canCreateFlyer(userData.role_config)

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Encartes</h2>
          <p className="text-muted-foreground">
            {canCreate 
              ? "Confira os encartes disponíveis e crie novos encartes" 
              : "Confira os encartes disponíveis"
            }
          </p>
        </div>
        {canCreate && <CreateFlyerButton />}
      </div>
      <FlyersList />
    </DashboardShell>
  )
}
