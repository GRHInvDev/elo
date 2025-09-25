import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Pencil, FileText, MessageSquare } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { FormPreview } from "@/components/forms/form-preview"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { type Field } from "@/lib/form-types"
import { DashboardShell } from "@/components/dashboard-shell"
import { auth } from "@clerk/nextjs/server"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { canAccessForm } from "@/lib/access-control"

export const metadata = {
  title: "Visualizar Formulário",
  description: "Visualize os detalhes de um formulário",
}

interface FormPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FormPage({ params }: FormPageProps) {
  const {id} = await params;
  const form = await api.form.getById(id)
  const user = await auth();
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
        <Link href="/forms">
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para solicitações
          </Button>
        </Link>

        <div className="flex md:items-center gap-y-4 justify-between mt-4 flex-col md:flex-row">
          <div className="max-w-2/3 w-2/3">
            <h1 className="text-3xl text-wrap font-bold tracking-tight">{form.title}</h1>
            <p className="text-muted-foreground mt-2">
              Criado {formatDistanceToNow(new Date(form.createdAt), { addSuffix: true, locale: ptBR })}
            </p>
            <div className="text-wrap">
              {form.description && <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.description ?? "Sem descrição"}</ReactMarkdown>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ">
            <Link href={`/forms/${form.id}/responses`}>
              <Button variant="outline" className="col-span-1 w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Respostas
              </Button>
            </Link>
              {
                user.userId === form.userId &&
                <Link href={`/forms/${form.id}/edit`}>
                  <Button variant="outline" className="col-span-1 w-full">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              }
            <Link href={`/forms/${form.id}/respond`}>
              <Button className="col-span-1 w-full">
                <FileText className="mr-2 h-4 w-4" />
                Responder
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-card/60 p-6 rounded-lg border">
        <FormPreview title={form.title} fields={form.fields as unknown as Field[]} readOnly />
      </div>
    </DashboardShell>
  )
}

