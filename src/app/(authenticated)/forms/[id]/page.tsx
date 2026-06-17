import type { ReactNode } from "react"
import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { Pencil, FileText, MessageSquare, Calendar, Eye, Lock, Globe } from "lucide-react"
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
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Solicitações", href: "/forms" },
          { label: form.title },
        ]}
        title={form.title}
        description={<FormDescription description={form.description} />}
      >
        {/* Barra de ações */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Gestão (somente quem pode editar) — à esquerda */}
            {canEdit && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href={`/forms/${form.id}/responses`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Respostas
                  </Button>
                </Link>
                <Link href={`/forms/${form.id}/edit`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              </div>
            )}

            {/* Ações do solicitante — à direita */}
            <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
              <Link href="/forms/my-responses">
                <Button variant="ghost" className="w-full sm:w-auto">
                  <FileText className="mr-2 h-4 w-4" />
                  Minhas solicitações
                </Button>
              </Link>
              <Link href={`/forms/${form.id}/respond`}>
                <Button className="w-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] hover:bg-[hsl(var(--brand-accent)/.9)] sm:w-auto">
                  <FileText className="mr-2 h-4 w-4" />
                  Abrir nova solicitação
                </Button>
              </Link>
            </div>
          </div>

          {/* Criar chamado manual — abaixo e com largura reduzida */}
          {canEdit && (
            <CreateManualResponseButtonWrapper
              formId={form.id}
              formFields={form.fields as unknown as Field[]}
              className="w-full sm:w-auto sm:self-start"
            />
          )}
        </div>

        {/* Faixa de info */}
        <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-[var(--v2-radius-card)] border border-[hsl(var(--v2-border-soft))] sm:grid-cols-3">
          <InfoCell
            label="Criado"
            icon={<Calendar className="h-3.5 w-3.5" />}
            value={formatDistanceToNow(new Date(form.createdAt), { addSuffix: true, locale: ptBR })}
          />
          <InfoCell
            label="Campos"
            icon={<FileText className="h-3.5 w-3.5" />}
            value={`${(form.fields as unknown[]).length} ao todo`}
            className="border-t border-[hsl(var(--v2-border-soft))] sm:border-l sm:border-t-0"
          />
          <InfoCell
            label="Acesso"
            icon={form.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
            value={form.isPrivate ? "Restrito" : "Público"}
            className="border-t border-[hsl(var(--v2-border-soft))] sm:border-l sm:border-t-0"
          />
        </div>

        <FormsPanel className="mt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Estes são os campos que você vai preencher. Clique em{" "}
              <strong className="font-medium text-foreground">Abrir nova solicitação</strong> para começar.
            </p>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2))] px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> Pré-visualização
            </span>
          </div>

          <FormPreview title={form.title} fields={form.fields as unknown as Field[]} readOnly />

          <div className="mt-6 flex justify-end border-t border-[hsl(var(--v2-border-soft))] pt-5">
            <Link href={`/forms/${form.id}/respond`}>
              <Button className="bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] hover:bg-[hsl(var(--brand-accent)/.9)]">
                <FileText className="mr-2 h-4 w-4" />
                Abrir nova solicitação
              </Button>
            </Link>
          </div>
        </FormsPanel>
      </FormsSubPageShell>
    </DashboardShell>
  )
}

interface InfoCellProps {
  label: string
  icon: ReactNode
  value: string
  className?: string
}

function InfoCell({ label, icon, value, className }: InfoCellProps) {
  return (
    <div className={`flex flex-col gap-1.5 bg-[hsl(var(--card)/.9)] px-4 py-3.5 ${className ?? ""}`}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <strong className="inline-flex items-center gap-2 text-sm font-semibold">
        <span className="text-[hsl(var(--v2-faint))]">{icon}</span>
        {value}
      </strong>
    </div>
  )
}

