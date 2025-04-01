import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FormResponseComponent } from "@/components/forms/form-response"
import { type Field } from "@/lib/form-types"
import { DashboardShell } from "@/components/dashboard-shell"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export const metadata = {
  title: "Responder Formulário",
  description: "Responda a um formulário",
}

interface RespondFormPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RespondFormPage({ params }: RespondFormPageProps) {
  const {id} = await params;
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
        <h1 className="text-3xl font-bold tracking-tight mt-4">{form.title}</h1>
        {form.description && <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.description}</ReactMarkdown>}
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <FormResponseComponent formId={id} fields={form.fields as unknown as Field[]} />
      </div>
    </DashboardShell>
  )
}

