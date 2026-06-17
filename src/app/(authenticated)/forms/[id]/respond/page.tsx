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

  const fields = form.fields as unknown as Field[]
  const requiredCount = fields.filter((f) => f.required).length

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
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--v2-border-soft))] pb-4">
            <h2 className="text-lg font-semibold tracking-tight">Preencha sua solicitação</h2>
            {requiredCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {requiredCount} {requiredCount === 1 ? "campo obrigatório" : "campos obrigatórios"} · marcados com{" "}
                <span className="text-[hsl(0_72%_58%)]">*</span>
              </span>
            )}
          </div>
          <FormResponseComponent formId={id} fields={fields} />
        </FormsPanel>
      </FormsSubPageShell>
    </DashboardShell>
  )
}

