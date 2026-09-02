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
import { FormsSubPageShell, FormsPanel } from "@/components/forms/forms-sub-page-shell"
import { CreateManualResponseButtonWrapper } from "@/components/forms/create-manual-response-button-wrapper"
import { canAccessForm, canEditForm } from "@/lib/access-control"

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
  const userData = await api.user.me()

  if (!form) {
    notFound()
  }

  // Verificar se o usuário tem permissão para acessar este formulário
  if (!canAccessForm(
    userData.role_config,
    id,
    userData.id,
    {
      userId: form.userId,
      isPrivate: form.isPrivate,
      allowedUsers: form.allowedUsers,
      allowedSectors: form.allowedSectors,
    },
    userData.setor
  )) {
    redirect("/forms")
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
                <Link href={`/forms/central?formId=${form.id}`}>
                  <Button variant="outline" className="w-full sm:w-auto rounded-xl border-border/80 text-xs font-semibold gap-1.5 shadow-2xs">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Central de Chamados
                  </Button>
                </Link>
                <Link href={`/forms/${form.id}/edit`}>
                  <Button variant="outline" className="w-full sm:w-auto rounded-xl border-border/80 text-xs font-semibold gap-1.5 shadow-2xs">
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              </div>
            )}

            {/* Ações do solicitante — à direita */}
            <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
              <Link href="/forms/my-responses">
                <Button variant="ghost" className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-1.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Minhas solicitações
                </Button>
              </Link>
              <Link href={`/forms/${form.id}/respond`}>
                <Button className="w-full rounded-xl text-xs font-semibold gap-1.5 shadow-sm sm:w-auto">
                  <FileText className="h-4 w-4" />
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
              className="w-full sm:w-auto sm:self-start rounded-xl"
            />
          )}
        </div>

        {/* Faixa de info */}
        <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs sm:grid-cols-3 p-2">
          <InfoCell
            label="Criado"
            icon={<Calendar className="h-4 w-4 text-primary" />}
            value={formatDistanceToNow(new Date(form.createdAt), { addSuffix: true, locale: ptBR })}
          />
          <InfoCell
            label="Campos"
            icon={<FileText className="h-4 w-4 text-primary" />}
            value={`${(form.fields as unknown[]).length} ao todo`}
            className="border-t border-border/60 sm:border-l sm:border-t-0"
          />
          <InfoCell
            label="Acesso"
            icon={form.isPrivate ? <Lock className="h-4 w-4 text-amber-500" /> : <Globe className="h-4 w-4 text-emerald-500" />}
            value={form.isPrivate ? "Restrito" : "Público"}
            className="border-t border-border/60 sm:border-l sm:border-t-0"
          />
        </div>

        <FormsPanel className="mt-5 bg-neutral-50 dark:bg-neutral-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Estes são os campos configurados no formulário. Clique em{" "}
              <strong className="font-semibold text-foreground">Abrir nova solicitação</strong> para preencher.
            </p>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-primary" /> Pré-visualização
            </span>
          </div>

          <FormPreview title={form.title} fields={form.fields as unknown as Field[]} readOnly />

          <div className="mt-6 flex justify-end border-t border-border/60 pt-5">
            <Link href={`/forms/${form.id}/respond`}>
              <Button className="rounded-xl font-semibold gap-2 shadow-sm text-xs">
                <FileText className="h-4 w-4" />
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
    <div className={`flex flex-col gap-1.5 px-6 py-4.5 ${className ?? ""}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="inline-flex items-center gap-2.5 text-sm font-bold text-foreground">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <span>{value}</span>
      </div>
    </div>
  )
}

