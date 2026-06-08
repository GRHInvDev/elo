import { FormBuilderWithSave } from "@/components/forms/form-builder-with-save"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { FormsSubPageShell } from "@/components/forms/v2/forms-sub-page-shell"
import { checkFormCreationAccess } from "@/lib/access-control-server"

export const metadata = {
  title: "Novo Formulário",
  description: "Crie um novo formulário personalizado",
}

export default async function NewFormPage() {
  await checkFormCreationAccess();
  return (
    <DashboardShell>
      <FormsSubPageShell
        backHref="/forms"
        backLabel="Voltar para formulários"
        title="Novo Formulário"
        description="Crie um novo formulário personalizado com os campos que desejar."
      >
        <FormBuilderWithSave mode="create" />
      </FormsSubPageShell>
    </DashboardShell>
  )
}

