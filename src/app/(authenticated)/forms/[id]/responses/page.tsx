import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ResponsesList } from "@/components/forms/responses-list"
import { Suspense } from "react"
import { ResponsesSkeleton } from "@/components/forms/responses-skeleton"
import { DashboardShell } from "@/components/dashboard-shell"

export const metadata = {
  title: "Respostas do Formulário",
  description: "Visualize as respostas enviadas para este formulário",
}

interface ResponsesPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ResponsesPage({ params }: ResponsesPageProps) {
  const { id } = await params
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

        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight">Respostas: {form.title}</h1>
          <p className="text-muted-foreground mt-2">Visualize e gerencie as respostas enviadas para este formulário.</p>
        </div>
      </div>

      <Suspense fallback={<ResponsesSkeleton />}>
        <ResponsesList formId={id} />
      </Suspense>
    </DashboardShell>
  )
}

