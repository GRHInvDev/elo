import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"

import { NewUsersHallContent } from "@/components/new-users-hall/new-users-hall-content"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { canManageNewUsersHall, canViewHallEntrada } from "@/lib/access-control"
import { api } from "@/trpc/server"

export const metadata = {
  title: "Hall de entrada",
  description: "Comunicação de novos colaboradores",
}

export default async function HallEntradaPage() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      redirect("/sign-in?redirect_url=/forms/hall-entrada")
    }

    const userData = await api.user.me()
    if (!canViewHallEntrada(userData.role_config)) {
      redirect("/dashboard")
    }

    const canManage = canManageNewUsersHall(userData.role_config)

    return (
      <DashboardShell>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Hall de entrada</h1>
          <p className="text-muted-foreground mt-2">
            Espaço para apresentar novos colaboradores à intranet
          </p>
        </div>
        <NewUsersHallContent canManage={canManage} />
      </DashboardShell>
    )
  } catch {
    redirect("/sign-in?redirect_url=/forms/hall-entrada")
  }
}
