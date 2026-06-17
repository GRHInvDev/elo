"use client"

import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Inbox, KanbanSquare, List as ListIcon, MessageSquare, Search } from "lucide-react"

import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { RequestStatusPill, STATUS_META } from "@/components/forms/v2/request-status-pill"
import { ResponseDetails } from "@/components/forms/response-details"
import { ResponseChat } from "@/components/forms/response-chat"
import { formatFormResponseNumber } from "@/lib/utils/form-response-number"
import type { Field } from "@/lib/form-types"
import type { FormResponse, ResponseStatus } from "@/types/form-responses"

type View = "lista" | "quadro"
type StatusFilter = "ALL" | ResponseStatus
const STATUS_ORDER: ResponseStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Todas" },
  { key: "NOT_STARTED", label: "Não iniciadas" },
  { key: "IN_PROGRESS", label: "Em andamento" },
  { key: "COMPLETED", label: "Concluídas" },
]

function shortId(r: Pick<FormResponse, "number" | "id">) {
  return r.number != null ? formatFormResponseNumber(r.number) : `#${r.id.slice(0, 6)}`
}

function age(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function UserResponsesList() {
  const [view, setView] = React.useState<View>("lista")
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<StatusFilter>("ALL")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const { data, isLoading } = api.formResponse.listUserResponses.useQuery()
  const responses = React.useMemo<FormResponse[]>(
    () => (data ?? []) as unknown as FormResponse[],
    [data],
  )

  const counts = React.useMemo(() => {
    let notStarted = 0
    let inProgress = 0
    let completed = 0
    for (const r of responses) {
      if (r.status === "NOT_STARTED") notStarted += 1
      else if (r.status === "IN_PROGRESS") inProgress += 1
      else if (r.status === "COMPLETED") completed += 1
    }
    return { total: responses.length, notStarted, inProgress, completed }
  }, [responses])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return responses.filter((r) => {
      if (filter !== "ALL" && r.status !== filter) return false
      if (!q) return true
      const title = (r.form?.title ?? "").toLowerCase()
      const idStr = `${r.number ?? ""}${r.id}`.toLowerCase()
      return title.includes(q) || idStr.includes(q)
    })
  }, [responses, filter, query])

  const grouped = React.useMemo(() => {
    const map: Record<ResponseStatus, FormResponse[]> = {
      NOT_STARTED: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    }
    for (const r of responses) map[r.status].push(r)
    return map
  }, [responses])

  const selected = React.useMemo(
    () => responses.find((r) => r.id === selectedId) ?? null,
    [responses, selectedId],
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.8)]"
          />
        ))}
      </div>
    )
  }

  if (responses.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 border-[hsl(var(--v2-border-soft))] p-10 text-center text-muted-foreground">
        <Inbox className="h-10 w-10 opacity-40" />
        <div>
          <h3 className="text-base font-medium text-foreground">Nenhuma solicitação ainda</h3>
          <p className="mt-1 text-sm">Você ainda não abriu nenhuma solicitação.</p>
        </div>
        <Link href="/forms">
          <Button
            size="sm"
            className="bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] hover:bg-[hsl(var(--brand-accent)/.9)]"
          >
            Ver solicitações disponíveis
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="flex flex-col">
      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Total" value={counts.total} />
        <Kpi label="Não iniciadas" value={counts.notStarted} />
        <Kpi label="Em andamento" value={counts.inProgress} tone="warn" />
        <Kpi label="Concluídas" value={counts.completed} tone="accent" />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº, formulário…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="inline-flex items-center gap-0 rounded-md border border-[hsl(var(--v2-border-soft))] bg-background p-0.5">
          <button
            type="button"
            onClick={() => setView("lista")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-xs font-medium transition-colors",
              view === "lista"
                ? "bg-[hsl(var(--v2-card-2))] text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ListIcon className="h-3.5 w-3.5" /> Lista
          </button>
          <button
            type="button"
            onClick={() => setView("quadro")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-xs font-medium transition-colors",
              view === "quadro"
                ? "bg-[hsl(var(--v2-card-2))] text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <KanbanSquare className="h-3.5 w-3.5" /> Quadro
          </button>
        </div>
      </div>

      {view === "lista" ? (
        <>
          {/* Chips de status */}
          <div className="mb-4 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-[hsl(var(--brand-accent)/.5)] bg-[hsl(var(--brand-accent)/.1)] text-[hsl(var(--brand-accent))]"
                      : "border-[hsl(var(--v2-border-soft))] text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {filtered.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-2 border-[hsl(var(--v2-border-soft))] p-10 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-40" />
              <p className="text-sm">Nenhuma solicitação encontrada.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((r) => (
                <RequestRow key={r.id} response={r} onOpen={() => setSelectedId(r.id)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status]
            const items = grouped[status]
            return (
              <Card
                key={status}
                className="flex flex-col border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.55)] p-3"
              >
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-hidden />
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <span className="ml-auto rounded-full bg-[hsl(var(--v2-card-2))] px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="flex max-h-[calc(100vh-360px)] min-h-[80px] flex-col gap-2 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="rounded-md border border-dashed border-[hsl(var(--v2-border-soft))] p-3 text-center text-xs text-[hsl(var(--v2-faint))]">
                      Nenhuma solicitação aqui
                    </p>
                  ) : (
                    items.map((r) => (
                      <BoardCard key={r.id} response={r} onOpen={() => setSelectedId(r.id)} />
                    ))
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
        >
          {selected && <RequestDetail response={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

interface KpiProps {
  label: string
  value: number
  tone?: "warn" | "accent"
}

function Kpi({ label, value, tone }: KpiProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2)/.6)] px-4 py-3">
      <span
        className={cn(
          "text-2xl font-bold leading-none tabular-nums",
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

function RequestRow({ response: r, onOpen }: { response: FormResponse; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.9)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--brand-accent)/.4)] hover:shadow-[var(--v2-shadow)]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-[hsl(var(--v2-faint))]">{shortId(r)}</span>
          <RequestStatusPill status={r.status} size="sm" />
        </div>
        <p className="mt-1.5 truncate text-[15px] font-semibold tracking-tight">
          {r.form?.title ?? "Sem título"}
        </p>
        {r.statusComment && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3 shrink-0 opacity-70" />
            <span className="truncate">{r.statusComment}</span>
          </p>
        )}
        <p className="mt-1.5 text-xs text-[hsl(var(--v2-faint))]">Enviada {age(r.createdAt)}</p>
      </div>
    </button>
  )
}

function BoardCard({ response: r, onOpen }: { response: FormResponse; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-2 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card))] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--brand-accent)/.45)] hover:shadow-[var(--v2-shadow)]"
    >
      <span className="font-mono text-[11px] text-[hsl(var(--v2-faint))]">{shortId(r)}</span>
      <p className="line-clamp-2 text-[13px] font-medium leading-snug">
        {r.form?.title ?? "Sem título"}
      </p>
      {r.statusComment && (
        <p className="line-clamp-1 text-[11px] text-muted-foreground">{r.statusComment}</p>
      )}
      <span className="mt-auto border-t border-[hsl(var(--v2-border-soft))] pt-2 text-[11px] text-[hsl(var(--v2-faint))]">
        {age(r.createdAt)}
      </span>
    </button>
  )
}

function RequestDetail({ response: r }: { response: FormResponse }) {
  const { data: form } = api.form.getById.useQuery({ id: r.formId })
  const fields = ((form?.fields as unknown as Field[]) ?? []).filter(Boolean)
  const responseObjects = Array.isArray(r.responses) ? r.responses : []
  const meta = STATUS_META[r.status]

  return (
    <>
      <div className="border-b border-[hsl(var(--v2-border-soft))] px-5 pb-4 pt-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[hsl(var(--v2-faint))]">{shortId(r)}</span>
          <RequestStatusPill status={r.status} size="sm" />
        </div>
        <h3 className="mt-2 text-base font-semibold leading-tight tracking-tight">
          {r.form?.title ?? "Sem título"}
        </h3>
        <p className="mt-1 text-xs text-[hsl(var(--v2-faint))]">Enviada {age(r.createdAt)}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {r.statusComment && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2)/.7)] p-3 text-sm">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} aria-hidden />
            <span>{r.statusComment}</span>
          </div>
        )}

        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Dados enviados
        </div>
        <div className="mb-5 rounded-xl border border-[hsl(var(--v2-border-soft))] p-3">
          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">Carregando campos…</p>
          ) : (
            <ResponseDetails
              responseData={responseObjects}
              formFields={fields.filter((f) => f.showInList !== false)}
            />
          )}
        </div>

        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> Conversa
        </div>
        <ResponseChat
          responseId={r.id}
          className="rounded-xl border border-[hsl(var(--v2-border-soft))] p-3"
        />
      </div>
    </>
  )
}
