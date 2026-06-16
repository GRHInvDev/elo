import { api } from "@/trpc/server"
import { notFound, redirect } from "next/navigation"
import { FormResponseComponent } from "@/components/forms/form-response"
import { type Field } from "@/lib/form-types"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { FormDescription } from "@/components/forms/form-description"
import { FormsSubPageShell, FormsPanel } from "@/components/forms/v2/forms-sub-page-shell"
import { canAccessForm } from "@/lib/access-control"

export const metadata = {
  title: "Abrir nova solicitação",
  description: "Responda a um formulário",
}

interface RespondFormPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RespondFormPage({ params }: RespondFormPageProps) {
  const { id } = await params;
  const form = await api.form.getById(id)
  const userData = await api.user.me()

  if (!form) {
    notFound()
  }

  // Verificar se o usuário tem permissão para acessar este formulário
  if (!canAccessForm(
    userData.role_config,
    id,
    userData.id,
    {
      userId: form.userId,
      isPrivate: form.isPrivate,
      allowedUsers: form.allowedUsers,
      allowedSectors: form.allowedSectors,
    },
    userData.setor
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
          { label: "Responder" },
        ]}
        title={form.title}
        description={<FormDescription description={form.description} />}
      >
        <FormsPanel>
          <FormResponseComponent formId={id} fields={form.fields as unknown as Field[]} />
        </FormsPanel>
      </FormsSubPageShell>
    </DashboardShell>
  )
}

