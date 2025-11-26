import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { FormResponseComponent } from "@/components/forms/form-response"
import { type Field } from "@/lib/form-types"
import { DashboardShell } from "@/components/dashboard-shell"
import { FormDescription } from "@/components/forms/form-description"
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
  const {id} = await params;
  const form = await api.form.getById(id)
  const userData = await api.user.me()

  // Verificar se o usuário tem permissão para acessar este formulário
  if (!canAccessForm(userData.role_config, id)) {
    redirect("/forms")
  }

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
        <h1 className="text-3xl font-bold tracking-tight mt-4">{form.title}</h1>
        <FormDescription description={form.description} />
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <FormResponseComponent formId={id} fields={form.fields as unknown as Field[]} />
      </div>
    </DashboardShell>
  )
}

