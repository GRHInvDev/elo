import { api } from "@/trpc/server"
import { notFound, redirect } from "next/navigation"
import { ResponsesList } from "@/components/forms/responses-list"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { FormsSubPageShell } from "@/components/forms/v2/forms-sub-page-shell"
import { canAccessForm } from "@/lib/access-control"

export const metadata = {
  title: "Respostas da Solicitação",
  description: "Visualize as respostas enviadas para esta solicitação",
}

interface ResponsesPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ResponsesPage({ params }: ResponsesPageProps) {
  const { id } = await params

  const userData = await api.user.me()
  const form = await api.form.getById(id)

  if (!form) {
    notFound()
  }

  // Verificar se o usuário pode acessar o formulário
  if (!canAccessForm(
    userData?.role_config,
    id,
    userData?.id,
    {
      userId: form.userId,
      isPrivate: form.isPrivate,
      allowedUsers: form.allowedUsers,
      allowedSectors: form.allowedSectors,
    },
    userData?.setor
  )) {
    redirect("/forms")
  }

  return (
    <DashboardShell>
      <FormsSubPageShell
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Solicitações", href: "/forms" },
          { label: form.title, href: `/forms/${id}` },
          { label: "Respostas" },
        ]}
        title={`Respostas: ${form.title}`}
        description="Visualize e gerencie as respostas enviadas para esta solicitação."
      >
        <ResponsesList formId={id} />
      </FormsSubPageShell>
    </DashboardShell>
  )
}

