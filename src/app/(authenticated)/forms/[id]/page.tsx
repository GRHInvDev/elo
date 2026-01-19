import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Pencil, FileText, MessageSquare } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { FormPreview } from "@/components/forms/form-preview"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { type Field } from "@/lib/form-types"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { FormDescription } from "@/components/forms/form-description"
import { CreateManualResponseButtonWrapper } from "@/components/forms/create-manual-response-button-wrapper"
import { canEditForm } from "@/lib/access-control"

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
  const { id } = await params;
  const form = await api.form.getById(id)
  // const user = await auth();
  const userData = await api.user.me()

  // Verificar se o usuário tem permissão para acessar este formulário
  // A verificação completa é feita no checkFormAccess que verifica privacidade
  if (!form) {
    notFound()
  }

  // Verificar acesso considerando privacidade
  const roleConfig = userData.role_config;

  // Se é TOTEM, não pode ver
  if (roleConfig?.isTotem) {
    redirect("/forms")
  }

  // Se não tem ID de usuário, redirecionar
  if (!userData.id) {
    redirect("/forms")
  }

  // Se é o criador, sempre tem acesso
  if (form.userId === userData.id) {
    // Continua normalmente
  } else if (form.isPrivate) {
    // Se é privado, verificar se tem acesso
    const isHidden = roleConfig?.hidden_forms?.includes(form.id) ?? false;
    const isAllowedUser = form.allowedUsers?.includes(userData.id) ?? false;
    const isAllowedSector = form.allowedSectors?.includes(userData.setor ?? "") ?? false;

    if (isHidden || (!isAllowedUser && !isAllowedSector)) {
      redirect("/forms")
    }
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
              <FormDescription description={form.description} />
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
              canEditForm(
                userData.role_config,
                userData.id,
                form.id,
                {
                  userId: form.userId,
                  ownerIds: form.ownerIds,
                  isPrivate: form.isPrivate,
                  allowedUsers: form.allowedUsers,
                  allowedSectors: form.allowedSectors,
                },
                userData.setor
              ) &&
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
                Abrir nova solicitação
              </Button>
            </Link>
            <CreateManualResponseButtonWrapper formId={form.id} formFields={form.fields as unknown as Field[]} />
          </div>
        </div>
      </div>

      <div className="bg-card/60 p-6 rounded-lg border">
        <FormPreview title={form.title} fields={form.fields as unknown as Field[]} readOnly />
      </div>
    </DashboardShell>
  )
}

