"use client"

import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowRight,
  Eye,
  FileText,
  Inbox,
  KanbanSquare,
  LifeBuoy,
  PlusCircle,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"
import type { Field } from "@/lib/form-types"
import { FormQuickOpenDrawer, type CatalogForm } from "./form-quick-open-drawer"
import { RequestStatusPill } from "./request-status-pill"
import type { ResponseStatus } from "@/types/form-responses"

interface FormsListV2Props {
  userCanCreateForm: boolean
  showCentralLink?: boolean
}

interface FormItem {
  id: string
  title: string | null
  description: string | null
  fields: unknown
  createdAt: Date | string
  user?: {
    setor?: string | null
  } | null
}

const ALL_CHIP = "Todos"

function getSector(form: FormItem): string {
  const setor = form.user?.setor?.trim()
  return setor && setor.length > 0 ? setor : "Geral"
}

function getFieldsArray(form: FormItem): Field[] {
  const fields = form.fields
  if (Array.isArray(fields)) return fields as Field[]
  return []
}

export function FormsListV2({ userCanCreateForm, showCentralLink }: FormsListV2Props) {
  const [query, setQuery] = React.useState("")
  const [sector, setSector] = React.useState<string>(ALL_CHIP)
  const [drawer, setDrawer] = React.useState<{ form: CatalogForm; fields: Field[] } | null>(null)

  const { data: formsRaw, isLoading } = api.form.list.useQuery()
  const { data: myResponses } = api.formResponse.listUserResponses.useQuery()

  const forms = React.useMemo<FormItem[]>(() => formsRaw ?? [], [formsRaw])

  const sectors = React.useMemo(() => {
    const set = new Set<string>()
    for (const f of forms) set.add(getSector(f))
    return [ALL_CHIP, ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [forms])

  const filteredForms = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return forms.filter((f) => {
      const matchesSector = sector === ALL_CHIP || getSector(f) === sector
      if (!matchesSector) return false
      if (!q) return true
      const title = (f.title ?? "").toLowerCase()
      const desc = (f.description ?? "").toLowerCase()
      return title.includes(q) || desc.includes(q)
    })
  }, [forms, query, sector])

  const kpis = React.useMemo(() => {
    const responses = myResponses ?? []
    let open = 0
    let waiting = 0
    for (const r of responses) {
      const status = r.status
      if (status !== "COMPLETED") open += 1
      if (status === "NOT_STARTED") waiting += 1
    }
    return { open, waiting }
  }, [myResponses])

  function handleOpen(form: FormItem) {
    const sectorLabel = getSector(form)
    const fieldsArr = getFieldsArray(form)
    setDrawer({
      form: {
        id: form.id,
        title: form.title ?? "Sem título",
        description: form.description,
        sector: sectorLabel,
        fieldsCount: fieldsArr.length,
      },
      fields: fieldsArr,
    })
  }

  return (
    <div className="v2-scope">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em]">
              Solicitações
            </h1>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Escolha um tipo de solicitação e abra um chamado para o setor responsável.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 md:w-auto">
          <Link href="/forms/my-responses" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Minhas solicitações
            </Button>
          </Link>
          {showCentralLink && (
            <Link href="/forms/central" className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Central de chamados
              </Button>
            </Link>
          )}
          {userCanCreateForm && (
            <Link href="/forms/new" className="flex-1 md:flex-none">
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar formulário
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard label="Em aberto" value={String(kpis.open)} />
        <KpiCard
          label="Aguardando você"
          value={String(kpis.waiting)}
          tone={kpis.waiting > 0 ? "warn" : undefined}
        />
      </div>

      {/* Grid: catálogo + trilho */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Catálogo */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tipo de solicitação…"
                className="pl-9"
              />
            </div>
          </div>

          {/* Chips */}
          <div className="mb-4 flex flex-wrap gap-2">
            {sectors.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSector(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  sector === s
                    ? "border-[hsl(var(--brand-accent)/.4)] bg-[hsl(var(--brand-accent)/.1)] text-[hsl(var(--brand-accent))]"
                    : "border-[hsl(var(--v2-border-soft))] bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Lista */}
          {isLoading ? (
            <CatalogSkeleton />
          ) : filteredForms.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-2 border-[hsl(var(--v2-border-soft))] p-10 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-50" />
              <p className="text-sm">
                {query
                  ? `Nenhum tipo encontrado para "${query}".`
                  : "Nenhum tipo de solicitação disponível."}
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredForms.map((form) => (
                <CatalogRow
                  key={form.id}
                  form={form}
                  onOpen={() => handleOpen(form)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Trilho lateral */}
        <aside className="lg:block">
          <Card className="border-[hsl(var(--v2-border-soft))] p-4 lg:sticky lg:top-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Minhas solicitações</span>
              <Link
                href="/forms/my-responses"
                className="text-xs font-semibold text-[hsl(var(--brand-accent))] hover:underline"
              >
                Ver todas
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {(myResponses ?? []).slice(0, 4).map((r) => (
                <MyRequestCard
                  key={r.id}
                  id={r.number != null ? `#${r.number}` : `#${r.id.slice(0, 6)}`}
                  status={r.status}
                  title={r.form?.title ?? "Sem título"}
                  age={formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: ptBR })}
                  href={`/forms/${r.formId}/responses/${r.id}`}
                />
              ))}
              {(!myResponses || myResponses.length === 0) && (
                <p className="rounded-md border border-dashed border-[hsl(var(--v2-border-soft))] p-4 text-center text-xs text-muted-foreground">
                  Você ainda não abriu nenhuma solicitação.
                </p>
              )}
            </div>
            <Separator className="my-4" />
            <Link href="/forms/kanban">
              <Button variant="outline" className="w-full justify-center">
                <KanbanSquare className="mr-2 h-4 w-4" />
                Abrir o Kanban
              </Button>
            </Link>
          </Card>
        </aside>
      </div>

      <FormQuickOpenDrawer
        form={drawer?.form ?? null}
        fieldsPreview={drawer?.fields}
        onOpenChange={(open) => {
          if (!open) setDrawer(null)
        }}
      />
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string
  tone?: "warn" | "accent"
}

function KpiCard({ label, value, tone }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2)/.6)] px-4 py-3 backdrop-blur-sm">
      <span
        className={cn(
          "text-2xl font-bold leading-none tracking-tight tabular-nums",
          tone === "warn" && "text-[hsl(38_92%_45%)] dark:text-[hsl(38_92%_60%)]",
          tone === "accent" && "text-[hsl(var(--brand-accent))]",
        )}
      >
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

interface CatalogRowProps {
  form: FormItem
  onOpen: () => void
}

function CatalogRow({ form, onOpen }: CatalogRowProps) {
  const sectorLabel = getSector(form)
  const fieldsArr = getFieldsArray(form)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex w-full items-center gap-4 rounded-[var(--v2-radius-card)] border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.9)] p-4 text-left transition-all",
        "hover:-translate-y-0.5 hover:border-[hsl(var(--brand-accent)/.4)] hover:shadow-[var(--v2-shadow)]",
        "backdrop-blur-sm",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--brand-accent)/.2)] bg-[hsl(var(--brand-accent)/.1)] text-[hsl(var(--brand-accent))]">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold leading-tight tracking-tight">
            {form.title ?? "Sem título"}
          </span>
        </div>
        {form.description && (
          <p className="mt-1 line-clamp-2 max-w-prose text-[13px] leading-snug text-muted-foreground">
            {form.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-[hsl(var(--v2-faint))]">
          <span>{sectorLabel}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-current opacity-60" aria-hidden />
          <span>{fieldsArr.length} campos</span>
          <span className="h-0.5 w-0.5 rounded-full bg-current opacity-60" aria-hidden />
          <span>{formatDistanceToNow(new Date(form.createdAt), { addSuffix: true, locale: ptBR })}</span>
        </div>
      </div>
      <div className="hidden shrink-0 gap-2 sm:flex">
        <span
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground"
        >
          <Eye className="h-3.5 w-3.5" /> Ver
        </span>
        <span
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[hsl(var(--brand-accent))] px-3 text-xs font-medium text-[hsl(var(--brand-accent-foreground))]"
        >
          Abrir solicitação <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  )
}

interface MyRequestCardProps {
  id: string
  status: ResponseStatus
  title: string
  age: string
  href: string
}

function MyRequestCard({ id, status, title, age, href }: MyRequestCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1.5 rounded-lg border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2)/.6)] p-3 transition-colors hover:border-border"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-[hsl(var(--v2-faint))]">{id}</span>
        <RequestStatusPill status={status} size="sm" />
      </div>
      <span className="line-clamp-2 text-xs font-medium leading-snug">{title}</span>
      <span className="text-[11px] text-[hsl(var(--v2-faint))]">{age}</span>
    </Link>
  )
}

function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-[var(--v2-radius-card)] border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.9)] p-4"
        >
          <div className="h-11 w-11 shrink-0 rounded-xl bg-muted/40" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-muted/40" />
            <div className="h-2.5 w-2/3 rounded bg-muted/30" />
            <div className="h-2.5 w-1/2 rounded bg-muted/20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default FormsListV2
