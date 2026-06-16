import { api } from "@/trpc/server"
import { notFound } from "next/navigation"
import { FormBuilderWithSave } from "@/components/forms/form-builder-with-save"
import { type Field } from "@/lib/form-types"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { FormsSubPageShell } from "@/components/forms/v2/forms-sub-page-shell"
import { checkFormEditAccess } from "@/lib/access-control-server"

export const metadata = {
  title: "Editar Formulário",
  description: "Edite um formulário existente",
}

interface EditFormPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  const { id } = await params;

  // Verificar se o usuário tem permissão para editar este formulário
  // Esta função verifica se é criador, owner, tem can_create_form ou tem acesso às respostas
  await checkFormEditAccess(id)

  const form = await api.form.getById(id)

  if (!form) {
    notFound()
  }

  return (
    <DashboardShell>
      <FormsSubPageShell
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Solicitações", href: "/forms" },
          { label: form.title, href: `/forms/${id}` },
          { label: "Editar" },
        ]}
        title="Editar Solicitação"
        description="Edite os campos e configurações da solicitação."
      >
        <FormBuilderWithSave
          mode="edit"
          formId={id}
          initialTitle={form.title}
          initialDescription={form.description ?? ""}
          initialFields={form.fields as unknown as Field[]}
          initialIsPrivate={form.isPrivate ?? false}
          initialAllowedUsers={form.allowedUsers ?? []}
          initialAllowedSectors={form.allowedSectors ?? []}
          initialOwnerIds={form.ownerIds ?? [] as string[]}
          initialSpreadsheetExportEnabled={form.spreadsheetExportEnabled ?? false}
        />
      </FormsSubPageShell>
    </DashboardShell>
  )
}

