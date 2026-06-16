import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { api } from "@/trpc/server"
import { canViewForms, canCreateForm, canManageRequests } from "@/lib/access-control"
import { FormsListV2 } from "@/components/forms/v2/forms-list-v2"

export const metadata = {
  title: "Solicitações",
  description: "Gerencie e responda solicitações",
}

export default async function FormsPage() {
  let user;

  try {
    user = await currentUser();
  } catch (error) {
    console.warn('[FormsPage] Erro ao obter usuário:', error instanceof Error ? error.message : 'Erro desconhecido');
    redirect("/sign-in?redirect_url=/forms");
  }

  if (!user) {
    redirect("/sign-in?redirect_url=/forms")
  }

  const userData = await api.user.me()

  if (!canViewForms(userData.role_config)) {
    redirect("/dashboard")
  }

  const userCanCreateForm = canCreateForm(userData.role_config)
  const userCanManageRequests = canManageRequests(userData.role_config)
  // Fallback: se não tem flag explícita mas é dono de algum formulário,
  // também pode acessar a Central (atende seus próprios chamados).
  const isOwnerOfAnyForm = userCanManageRequests
    ? true
    : await api.form.isOwnerOfAnyForm().catch(() => false)
  const showCentralLink = userCanManageRequests || isOwnerOfAnyForm

  return (
    <DashboardShell>
      <FormsListV2
        userCanCreateForm={userCanCreateForm}
        showCentralLink={showCentralLink}
      />
    </DashboardShell>
  )
}
