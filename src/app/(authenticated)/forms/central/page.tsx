import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"

import { api } from "@/trpc/server"
import { canManageRequests, canViewForms } from "@/lib/access-control"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { CentralView } from "@/components/forms/v2/central-view"

export const metadata = {
  title: "Central de Chamados",
  description: "Workspace de atendimento das solicitações da intranet.",
}

export default async function CentralChamadosPage() {
  let user
  try {
    user = await currentUser()
  } catch {
    redirect("/sign-in?redirect_url=/forms/central")
  }

  if (!user) {
    redirect("/sign-in?redirect_url=/forms/central")
  }

  const userData = await api.user.me()

  if (!canViewForms(userData.role_config)) {
    redirect("/dashboard")
  }

  // Acesso é concedido para sudo / can_manage_requests / can_create_form
  // ou para quem é dono de algum formulário (caso usual de "atende seus próprios chamados").
  const hasFlag = canManageRequests(userData.role_config)
  let isOwnerOfAnyForm = false
  if (!hasFlag) {
    try {
      isOwnerOfAnyForm = await api.form.isOwnerOfAnyForm()
    } catch {
      isOwnerOfAnyForm = false
    }
  }

  if (!hasFlag && !isOwnerOfAnyForm) {
    redirect("/forms")
  }

  return (
    <DashboardShell>
      <CentralView />
    </DashboardShell>
  )
}
