import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ResponsesList } from "@/components/forms/responses-list"
import { DashboardShell } from "@/components/dashboard-shell"
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

  // Verificar se o usuário pode acessar o formulário
  const userData = await api.user.me()
  if (!canAccessForm(userData?.role_config, id)) {
    redirect("/forms")
  }

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

        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight">Respostas: {form.title}</h1>
          <p className="text-muted-foreground mt-2">Visualize e gerencie as respostas enviadas para esta solicitação.</p>
        </div>
      </div>

      <ResponsesList formId={id} />
    </DashboardShell>
  )
}

