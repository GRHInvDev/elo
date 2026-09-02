"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Clock,
  Edit,
  FileText,
  Filter,
  Inbox,
  KanbanSquare,
  List as ListIcon,
  MessageSquare,
  Plus,
  Search,
  UserCheck,
} from "lucide-react"

import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import { getSectorVisualInfo } from "@/lib/form-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { RequestStatusPill, STATUS_META } from "@/components/forms/request-status-pill"
import { ResponseDetails } from "@/components/forms/response-details"
import { ResponseChat } from "@/components/forms/response-chat"
import { EditResponseModal } from "@/components/forms/edit-response-modal"
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

function initials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
    }
    return (name[0] ?? "?").toUpperCase()
  }
  return (email?.[0] ?? "?").toUpperCase()
}

export function UserResponsesList() {
  const searchParams = useSearchParams()
  const responseIdParam = searchParams.get("responseId")
  const [view, setView] = React.useState<View>("lista")
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<StatusFilter>("ALL")
  const [selectedId, setSelectedId] = React.useState<string | null>(responseIdParam)
  const [editTarget, setEditTarget] = React.useState<{ responseId: string; formId: string } | null>(null)

  const { data, isLoading } = api.formResponse.listUserResponses.useQuery()
  const { data: sectorConfigs } = api.setores.getSectorConfigs.useQuery()

  React.useEffect(() => {
    if (responseIdParam) {
      setSelectedId(responseIdParam)
    }
  }, [responseIdParam])

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

  const selected = React.useMemo(() => {
    if (!selectedId) return null
    const cleanNum = selectedId.replace(/^#/, "")
    return (
      responses.find((r) => r.id === selectedId || (r.number != null && String(r.number) === cleanNum)) ??
      null
    )
  }, [responses, selectedId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-border/50 bg-card/60 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border border-border/50 bg-card/60 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (responses.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-12 text-center text-muted-foreground shadow-sm">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <Inbox className="h-8 w-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-base font-bold text-foreground">Nenhuma solicitação ainda</h3>
          <p className="text-xs text-muted-foreground">Você ainda não abriu nenhum chamado ou solicitação de serviço.</p>
        </div>
        <Link href="/forms">
          <Button size="sm" className="rounded-xl text-xs font-semibold gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            Abrir Solicitação
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total" value={counts.total} />
        <KpiCard label="Não iniciadas" value={counts.notStarted} tone="danger" />
        <KpiCard label="Em andamento" value={counts.inProgress} tone="warn" />
        <KpiCard label="Concluídas" value={counts.completed} tone="accent" />
      </div>

      {/* Toolbar com Filtros Segmentados e Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/60 gap-1 overflow-x-auto scrollbar-hide shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground px-2 flex items-center gap-1 shrink-0">
            <Filter className="h-3.5 w-3.5 text-primary" />
            Status:
          </span>
          {STATUS_FILTERS.map((f) => {
            const isSelected = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm scale-102"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nº ou serviço…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-border/60 bg-card/60 backdrop-blur-sm"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/60 gap-0.5">
            <button
              type="button"
              onClick={() => setView("lista")}
              className={cn(
                "p-1.5 rounded-lg transition-all text-xs font-medium cursor-pointer",
                view === "lista"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Visualização em Lista"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("quadro")}
              className={cn(
                "p-1.5 rounded-lg transition-all text-xs font-medium cursor-pointer",
                view === "quadro"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Visualização em Quadro"
            >
              <KanbanSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {view === "lista" ? (
        filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-10 text-center text-muted-foreground shadow-sm">
            <Inbox className="h-7 w-7 opacity-50" />
            <p className="text-xs">Nenhuma solicitação encontrada com os filtros selecionados.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <RequestCard
                key={r.id}
                response={r}
                sectorConfigs={sectorConfigs}
                onOpen={() => setSelectedId(r.id)}
              />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status]
            const items = grouped[status]
            return (
              <Card
                key={status}
                className="flex flex-col rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-hidden />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">{meta.label}</span>
                  <span className="ml-auto rounded-lg bg-muted/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground border border-border/40">
                    {items.length}
                  </span>
                </div>
                <div className="flex max-h-[calc(100vh-360px)] min-h-[100px] flex-col gap-2.5 overflow-y-auto scrollbar-hide">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground/70 flex items-center justify-center h-24">
                      Nenhuma solicitação
                    </div>
                  ) : (
                    items.map((r) => (
                      <BoardCard
                        key={r.id}
                        response={r}
                        sectorConfigs={sectorConfigs}
                        onOpen={() => setSelectedId(r.id)}
                      />
                    ))
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sheet de Detalhes do Chamado */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-[520px] border-l border-border/50 bg-card/95 backdrop-blur-xl shadow-xl"
        >
          {selected && (
            <RequestDetail
              response={selected}
              sectorConfigs={sectorConfigs}
              onClose={() => setSelectedId(null)}
              onEdit={selected.status !== "COMPLETED" ? (responseId, formId) => setEditTarget({ responseId, formId }) : undefined}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de Edição de Resposta */}
      {editTarget && (
        <EditResponseModal
          responseId={editTarget.responseId}
          formId={editTarget.formId}
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: number
  tone?: "warn" | "accent" | "danger"
}

function KpiCard({ label, value, tone }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 px-4 py-3.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs">
      <span
        className={cn(
          "font-mono text-2xl font-bold tracking-tight",
          tone === "warn" && "text-amber-500",
          tone === "danger" && "text-rose-500",
          tone === "accent" && "text-emerald-500",
          !tone && "text-foreground",
        )}
      >
        {value}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

function RequestCard({
  response: r,
  sectorConfigs,
  onOpen,
}: {
  response: FormResponse
  sectorConfigs?: Record<string, { icon: string; color: string }>
  onOpen: () => void
}) {
  const sectorName = r.form?.user?.setor ?? "Geral"
  const { icon: SectorIcon, color: sectorColor } = getSectorVisualInfo(sectorName, sectorConfigs)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted dark:to-transparent/70 p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer shadow-xs",
        "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
      )}
      style={{
        backgroundColor: sectorColor
      }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-xs transition-transform group-hover:scale-105"
        style={{
          borderColor: `${sectorColor}40`,
          backgroundColor: `${sectorColor}18`,
          color: sectorColor,
        }}
      >
        <SectorIcon className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary">{shortId(r)}</span>
          <RequestStatusPill status={r.status} size="sm" />
        </div>

        <p className="mt-1 truncate text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {r.form?.title ?? "Sem título"}
        </p>

        {r.statusComment && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
            <MessageSquare className="h-3 w-3 shrink-0 text-primary" />
            <span>{r.statusComment}</span>
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <p className="flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground/70" />
            Enviada {age(r.createdAt)}
          </p>

          {r.assignedTo && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              <UserCheck className="h-3 w-3 shrink-0" />
              <span>Atendente: {r.assignedTo.name}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function BoardCard({
  response: r,
  sectorConfigs,
  onOpen,
}: {
  response: FormResponse
  sectorConfigs?: Record<string, { icon: string; color: string }>
  onOpen: () => void
}) {
  const sectorName = r.form?.user?.setor ?? "Geral"
  const { icon: SectorIcon, color: sectorColor } = getSectorVisualInfo(sectorName, sectorConfigs)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        "flex w-full flex-col gap-2 rounded-xl border border-border/50 bg-background/50 p-3.5 text-left transition-all duration-200 cursor-pointer",
        "hover:border-primary/40 hover:bg-background/90 hover:scale-[1.01] hover:shadow-xs",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SectorIcon className="h-3.5 w-3.5" style={{ color: sectorColor }} />
          <span className="font-mono text-xs font-bold text-primary">{shortId(r)}</span>
        </div>
        {r.assignedTo && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded" title={`Atendente: ${r.assignedTo.name}`}>
            <UserCheck className="h-3 w-3 shrink-0" />
            <span>{r.assignedTo.name.split(" ")[0]}</span>
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-xs font-semibold text-foreground leading-snug">
        {r.form?.title ?? "Sem título"}
      </p>
      {r.statusComment && (
        <p className="line-clamp-1 text-[11px] text-muted-foreground">{r.statusComment}</p>
      )}
      <span className="mt-auto border-t border-border/30 pt-2 text-[10px] text-muted-foreground">
        {age(r.createdAt)}
      </span>
    </div>
  )
}

function RequestDetail({
  response: r,
  onEdit,
}: {
  response: FormResponse
  sectorConfigs?: Record<string, { icon: string; color: string }>
  onClose: () => void
  onEdit?: (responseId: string, formId: string) => void
}) {
  const { data: form } = api.form.getById.useQuery({ id: r.formId })

  const fields = ((form?.fields as unknown as Field[]) ?? []).filter(Boolean)
  const responseObjects = Array.isArray(r.responses) ? r.responses : []
  const meta = STATUS_META[r.status]

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border/50 px-6 pb-5 pt-6 bg-muted/20 pr-12">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary">{shortId(r)}</span>
            <RequestStatusPill status={r.status} size="sm" />
          </div>
          <h3 className="mt-1.5 text-base font-bold leading-tight tracking-tight text-foreground">
            {r.form?.title ?? "Sem título"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground/70" />
            Enviada {age(r.createdAt)}
          </p>
        </div>

        {r.status !== "COMPLETED" && onEdit && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1 border-border/80 bg-background hover:bg-muted cursor-pointer"
              onClick={() => onEdit(r.id, r.formId)}
              title="Editar respostas enviadas"
            >
              <Edit className="h-3.5 w-3.5 text-primary" />
              <span>Editar</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {r.assignedTo && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9 border border-primary/30 shrink-0">
                <AvatarImage src={r.assignedTo.imageUrl ?? ""} />
                <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                  {initials(r.assignedTo.name, r.assignedTo.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                  <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{r.assignedTo.name}</span>
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {r.assignedTo.setor ? `${r.assignedTo.setor} • ` : ""}Responsável pelo seu atendimento
                </p>
              </div>
            </div>
            <span className="rounded-md bg-primary/10 px-2 py-1 text-[10.5px] font-semibold text-primary shrink-0">
              Em atendimento
            </span>
          </div>
        )}

        {r.statusComment && (
          <div className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-background/50 p-3.5 text-xs text-foreground">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} aria-hidden />
            <div>
              <span className="font-semibold block text-muted-foreground text-[10px] uppercase">Nota do atendimento:</span>
              <span>{r.statusComment}</span>
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="size-3.5 text-primary" />
            Dados da Solicitação
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 p-4">
            {fields.length === 0 ? (
              <p className="text-xs text-muted-foreground">Carregando dados…</p>
            ) : (
              <ResponseDetails
                responseData={responseObjects}
                formFields={fields.filter((f) => f.showInList !== false)}
              />
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="size-3.5 text-primary" />
            Chat & Acompanhamento
          </div>
          <ResponseChat
            responseId={r.id}
            className="rounded-xl border border-border/50 bg-card/60 p-4"
          />
        </div>
      </div>
    </>
  )
}
