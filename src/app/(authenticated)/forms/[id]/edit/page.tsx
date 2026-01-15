import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FormBuilderWithSave } from "@/components/forms/form-builder-with-save"
import { type Field } from "@/lib/form-types"
import { DashboardShell } from "@/components/dashboard-shell"
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
      <div className="mb-8">
        <Link href={`/forms/${id}`}>
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para a solicitação
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-4">Editar Solicitação</h1>
        <p className="text-muted-foreground mt-2">Edite os campos e configurações da solicitação.</p>
      </div>

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
      />
    </DashboardShell>
  )
}

