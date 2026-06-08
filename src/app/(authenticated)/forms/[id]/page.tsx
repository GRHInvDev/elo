import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { Pencil, FileText, MessageSquare } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { FormPreview } from "@/components/forms/form-preview"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { type Field } from "@/lib/form-types"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { FormDescription } from "@/components/forms/form-description"
import { FormsSubPageShell, FormsPanel } from "@/components/forms/v2/forms-sub-page-shell"
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

  const canEdit = canEditForm(
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
  )

  return (
    <DashboardShell>
      <FormsSubPageShell
        backHref="/forms"
        backLabel="Voltar para solicitações"
        title={form.title}
        description={
          <>
            <p>
              Criado {formatDistanceToNow(new Date(form.createdAt), { addSuffix: true, locale: ptBR })}
            </p>
            <FormDescription description={form.description} className="mt-2" />
          </>
        }
        actions={
          <>
            <Link href={`/forms/${form.id}/responses`} className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Respostas
              </Button>
            </Link>
            {canEdit && (
              <Link href={`/forms/${form.id}/edit`} className="flex-1 md:flex-none">
                <Button variant="outline" className="w-full">
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </Link>
            )}
            <Link href={`/forms/${form.id}/respond`} className="flex-1 md:flex-none">
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Abrir nova solicitação
              </Button>
            </Link>
            <CreateManualResponseButtonWrapper formId={form.id} formFields={form.fields as unknown as Field[]} />
          </>
        }
      >
        <FormsPanel>
          <FormPreview title={form.title} fields={form.fields as unknown as Field[]} readOnly />
        </FormsPanel>
      </FormsSubPageShell>
    </DashboardShell>
  )
}

