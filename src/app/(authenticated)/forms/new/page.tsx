import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { FormBuilderWithSave } from "@/components/forms/form-builder-with-save"
import { DashboardShell } from "@/components/dashboard-shell"
import { checkFormCreationAccess } from "@/lib/access-control"

export const metadata = {
  title: "Novo Formulário",
  description: "Crie um novo formulário personalizado",
}

export default async function NewFormPage() {
  await checkFormCreationAccess();
  return (
    <DashboardShell>
      <div className="mb-8">
        <Link href="/forms">
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para formulários
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-4">Novo Formulário</h1>
        <p className="text-muted-foreground mt-2">Crie um novo formulário personalizado com os campos que desejar.</p>
      </div>

      <FormBuilderWithSave mode="create" />
    </DashboardShell>
  )
}

