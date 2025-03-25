import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FormBuilderWithSave } from "@/components/forms/form-builder-with-save"
import { type Field } from "@/lib/form-types"
import { DashboardShell } from "@/components/dashboard-shell"

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
  const form = await api.form.getById({id})
  
  if (!form) {
    notFound()
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <Link href={`/forms/${id}`}>
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para o formulário
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-4">Editar Formulário</h1>
        <p className="text-muted-foreground mt-2">Edite os campos e configurações do formulário.</p>
      </div>

      <FormBuilderWithSave
        mode="edit"
        formId={id}
        initialTitle={form.title}
        initialDescription={form.description ?? ""}
        initialFields={form.fields as unknown as Field[]}
      />
    </DashboardShell>
  )
}

