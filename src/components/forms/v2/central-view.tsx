"use client"

import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow, formatDistanceStrict } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Filter,
  Inbox,
  KanbanSquare,
  List as ListIcon,
  MoreHorizontal,
  Plus,
  Search,
  Tags,
  X,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"
import { ResponseChat } from "@/components/forms/response-chat"
import { ResponseDetails } from "@/components/forms/response-details"
import type { Field } from "@/lib/form-types"
import type { FormResponse, ResponseStatus } from "@/types/form-responses"
import { STATUS_META } from "./request-status-pill"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { VirtualizedQueue } from "./virtualized-queue"
import { VirtualizedBoard } from "./virtualized-board"
import { TagsManagerModal } from "@/app/(authenticated)/forms/kanban/_components/tags-manager-modal"
import { EditResponseModal } from "@/components/forms/edit-response-modal"
import type { OnDragEndResponder } from "@hello-pangea/dnd"

type View = "fila" | "quadro"
type Tab = "ALL" | ResponseStatus
const STATUS_ORDER: ResponseStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]

function initials(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const a = firstName?.[0]
  const b = lastName?.[0]
  if (a || b) return `${a ?? ""}${b ?? ""}`.toUpperCase() || "?"
  return (email?.[0] ?? "?").toUpperCase()
}

function fullName(user?: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  if (!user) return "Sem solicitante"
  const a = user.firstName ?? ""
  const b = user.lastName ?? ""
  const name = `${a} ${b}`.trim()
  if (name.length > 0) return name
  return user.email ?? "—"
}

function shortId(r: FormResponse) {
  return r.number != null ? `#${r.number}` : `#${r.id.slice(0, 6)}`
}

export function CentralView() {
  const [view, setView] = React.useState<View>("fila")
  const [tab, setTab] = React.useState<Tab>("ALL")
  const [query, setQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([])
  const [tagsModalOpen, setTagsModalOpen] = React.useState(false)
  const [editResponseId, setEditResponseId] = React.useState<string | null>(null)
  const [editFormId, setEditFormId] = React.useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)

  const { data, isLoading, refetch } = api.formResponse.listKanBan.useQuery({
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
  })
  const { data: availableTags = [] } = api.formResponse.getTags.useQuery()
  const utils = api.useUtils()

  // Estado local para feedback otimista do arrastar (drag-and-drop)
  const [responses, setResponses] = React.useState<FormResponse[]>([])
  React.useEffect(() => {
    setResponses((data ?? []) as unknown as FormResponse[])
  }, [data])

  React.useEffect(() => {
    if (responses.length > 0 && !selectedId) {
      setSelectedId(responses[0]!.id)
    }
  }, [responses, selectedId])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return responses.filter((r) => {
      if (tab !== "ALL" && r.status !== tab) return false
      if (!q) return true
      const name = fullName(r.user).toLowerCase()
      const formTitle = (r.form?.title ?? "").toLowerCase()
      const idStr = `${r.number ?? ""}`
      return name.includes(q) || formTitle.includes(q) || idStr.includes(q)
    })
  }, [responses, tab, query])

  const currentResponse = React.useMemo(
    () => responses.find((r) => r.id === selectedId) ?? null,
    [responses, selectedId],
  )

  const counts = React.useMemo(() => {
    let notStarted = 0
    let inProgress = 0
    let done = 0
    let recentDone = 0
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    for (const r of responses) {
      if (r.status === "NOT_STARTED") notStarted += 1
      if (r.status === "IN_PROGRESS") inProgress += 1
      if (r.status === "COMPLETED") {
        done += 1
        const updated = new Date(r.updatedAt)
        if (updated >= todayStart) recentDone += 1
      }
    }
    const aging = responses.filter((r) => {
      if (r.status === "COMPLETED") return false
      const ageH = (Date.now() - new Date(r.createdAt).getTime()) / 1000 / 3600
      return ageH > 24
    }).length
    return { notStarted, inProgress, done, recentDone, aging }
  }, [responses])

  const updateStatus = api.formResponse.updateStatus.useMutation({
    onSuccess: () => {
      void utils.formResponse.listKanBan.invalidate()
      void refetch()
    },
    onError: (err) => toast.error(`Não foi possível atualizar: ${err.message}`),
  })

  function handleStatusChange(id: string, status: ResponseStatus) {
    updateStatus.mutate({ responseId: id, status })
  }

  function handleAssume(id: string, currentStatus: ResponseStatus) {
    if (currentStatus === "NOT_STARTED") {
      updateStatus.mutate({ responseId: id, status: "IN_PROGRESS" })
      toast.success("Chamado assumido e movido para Em progresso")
    } else {
      toast.success("Você está atendendo este chamado")
    }
  }

  // Arrastar um card para outro nível (coluna de status)
  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const newStatus = destination.droppableId as ResponseStatus
    // Feedback imediato na UI
    setResponses((prev) =>
      prev.map((r) => (r.id === draggableId ? { ...r, status: newStatus } : r)),
    )
    updateStatus.mutate({ responseId: draggableId, status: newStatus })
    toast.success(`Chamado movido para ${STATUS_META[newStatus].label}`)
  }

  // Abrir o chamado no painel de detalhes (visão Fila)
  function handleOpenDetails(id: string) {
    setSelectedId(id)
    setView("fila")
  }

  function handleEdit(id: string, formId: string) {
    setEditResponseId(id)
    setEditFormId(formId)
    setEditModalOpen(true)
  }

  function handleMoveToNextStatus(id: string, currentStatus: ResponseStatus) {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus)
    if (currentIndex < STATUS_ORDER.length - 1) {
      const nextStatus = STATUS_ORDER[currentIndex + 1]!
      setResponses((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)),
      )
      updateStatus.mutate({ responseId: id, status: nextStatus })
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/forms"
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
              Central de Chamados
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Atenda, acompanhe e resolva as solicitações recebidas nos formulários
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border/60 text-xs font-medium gap-1.5"
            onClick={() => setTagsModalOpen(true)}
          >
            <Tags className="h-3.5 w-3.5 text-primary" />
            Gerenciar Tags
          </Button>
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/60 gap-0.5">
            <button
              type="button"
              onClick={() => setView("fila")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                view === "fila"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ListIcon className="h-3.5 w-3.5" /> Fila
            </button>
            <button
              type="button"
              onClick={() => setView("quadro")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                view === "quadro"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <KanbanSquare className="h-3.5 w-3.5" /> Quadro
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Novos" value={counts.notStarted} />
        <Kpi label="Em progresso" value={counts.inProgress} tone="warn" />
        <Kpi label="Aguardando +24h" value={counts.aging} tone={counts.aging > 0 ? "danger" : undefined} />
        <Kpi label="Resolvidos hoje" value={counts.recentDone} tone="accent" />
      </div>

      {/* Conteúdo */}
      {view === "fila" ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[372px_1fr]">
          {/* Fila */}
          <div className="flex min-h-0 flex-col">
            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar nº, solicitante…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(
                      "relative h-10 w-10 shrink-0",
                      selectedTagIds.length > 0 && "border-[hsl(var(--brand-accent)/.5)] text-[hsl(var(--brand-accent))]",
                    )}
                    aria-label="Filtrar por tags"
                  >
                    <Filter className="h-4 w-4" />
                    {selectedTagIds.length > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--brand-accent))] px-1 text-[10px] font-bold text-[hsl(var(--brand-accent-foreground))]">
                        {selectedTagIds.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <div className="flex items-center justify-between border-b p-3">
                    <span className="text-sm font-semibold">Filtrar por tags</span>
                    {selectedTagIds.length > 0 && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedTagIds([])}
                      >
                        <X className="h-3 w-3" /> Limpar
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2">
                    {availableTags.length === 0 ? (
                      <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                        Nenhuma tag cadastrada ainda.
                      </p>
                    ) : (
                      availableTags.map((t) => {
                        const checked = selectedTagIds.includes(t.id)
                        return (
                          <label
                            key={t.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                setSelectedTagIds((prev) =>
                                  value
                                    ? [...prev, t.id]
                                    : prev.filter((id) => id !== t.id),
                                )
                              }}
                            />
                            <span
                              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: t.cor ?? "hsl(var(--muted-foreground))" }}
                              aria-hidden
                            />
                            <span className="truncate">{t.nome}</span>
                            {t.countVezesUsadas != null && (
                              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                                {t.countVezesUsadas}
                              </span>
                            )}
                          </label>
                        )
                      })
                    )}
                  </div>
                  <div className="border-t p-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start text-xs"
                      onClick={() => setTagsModalOpen(true)}
                    >
                      <Tags className="mr-2 h-3.5 w-3.5" />
                      Gerenciar tags…
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {selectedTagIds.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {selectedTagIds.map((id) => {
                  const t = availableTags.find((tag) => tag.id === id)
                  if (!t) return null
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2))] px-2 py-0.5 text-[11px]"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: t.cor ?? "hsl(var(--muted-foreground))" }}
                        aria-hidden
                      />
                      {t.nome}
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedTagIds((prev) => prev.filter((tid) => tid !== id))}
                        aria-label={`Remover filtro ${t.nome}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-2">
              <TabsList className="bg-transparent p-0">
                <TabsTrigger
                  value="ALL"
                  className="data-[state=active]:bg-[hsl(var(--v2-card-2))] data-[state=active]:text-foreground rounded-md px-2.5 py-1 text-xs font-semibold"
                >
                  Todos
                </TabsTrigger>
                <TabsTrigger
                  value="NOT_STARTED"
                  className="data-[state=active]:bg-[hsl(var(--v2-card-2))] data-[state=active]:text-foreground rounded-md px-2.5 py-1 text-xs font-semibold"
                >
                  Novos
                </TabsTrigger>
                <TabsTrigger
                  value="IN_PROGRESS"
                  className="data-[state=active]:bg-[hsl(var(--v2-card-2))] data-[state=active]:text-foreground rounded-md px-2.5 py-1 text-xs font-semibold"
                >
                  Andamento
                </TabsTrigger>
                <TabsTrigger
                  value="COMPLETED"
                  className="data-[state=active]:bg-[hsl(var(--v2-card-2))] data-[state=active]:text-foreground rounded-md px-2.5 py-1 text-xs font-semibold"
                >
                  Concluídos
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col gap-2">
              {isLoading ? (
                <SkeletonRow count={4} />
              ) : (
                <VirtualizedQueue
                  responses={filtered}
                  activeId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
            </div>
          </div>

          {/* Detalhe */}
          {currentResponse ? (
            <RequestDetail
              response={currentResponse}
              onStatusChange={handleStatusChange}
              onAssume={handleAssume}
              onOpenTagsModal={() => setTagsModalOpen(true)}
            />
          ) : (
            <Card className="flex flex-col items-center justify-center gap-3 border-[hsl(var(--v2-border-soft))] p-10 text-center text-muted-foreground">
              <Inbox className="h-10 w-10 opacity-40" />
              <p className="text-sm">Selecione um chamado na fila para começar a atender.</p>
            </Card>
          )}
        </div>
      ) : (
        <VirtualizedBoard
          responses={responses}
          availableTags={availableTags}
          onSelect={handleOpenDetails}
          onDragEnd={onDragEnd}
          onOpenDetails={handleOpenDetails}
          onEdit={handleEdit}
          onOpenChat={handleOpenDetails}
          onMoveToNextStatus={handleMoveToNextStatus}
          onOpenTagsManager={() => setTagsModalOpen(true)}
        />
      )}

      <TagsManagerModal open={tagsModalOpen} onOpenChange={setTagsModalOpen} />

      {editResponseId && editFormId && (
        <EditResponseModal
          responseId={editResponseId}
          formId={editFormId}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditResponseId(null)
            setEditFormId(null)
          }}
        />
      )}
    </div>
  )
}

interface KpiProps {
  label: string
  value: number
  tone?: "warn" | "danger" | "accent"
}

function Kpi({ label, value, tone }: KpiProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-xs">
      <span
        className={cn(
          "text-2xl font-bold leading-none tabular-nums",
          tone === "warn" && "text-amber-500",
          tone === "danger" && "text-rose-500",
          tone === "accent" && "text-emerald-500",
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

function SkeletonRow({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse gap-3 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.8)] p-3"
        >
          <div className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-2/3 rounded bg-muted/40" />
            <div className="h-2.5 w-1/2 rounded bg-muted/30" />
          </div>
        </div>
      ))}
    </>
  )
}

interface RequestDetailProps {
  response: FormResponse
  onStatusChange: (id: string, status: ResponseStatus) => void
  onAssume: (id: string, currentStatus: ResponseStatus) => void
  onOpenTagsModal: () => void
}

function RequestDetail({ response: r, onStatusChange, onAssume, onOpenTagsModal }: RequestDetailProps) {
  const { data: form } = api.form.getById.useQuery({ id: r.formId })
  const { data: allTags = [] } = api.formResponse.getAllTags.useQuery()
  const utils = api.useUtils()

  const applyTagMutation = api.formResponse.applyTag.useMutation({
    onSuccess: () => {
      toast.success("Tag aplicada ao chamado")
      void utils.formResponse.listKanBan.invalidate()
      void utils.formResponse.getTags.invalidate()
    },
    onError: (err) => toast.error(err.message || "Erro ao aplicar tag"),
  })

  const removeTagMutation = api.formResponse.removeTag.useMutation({
    onSuccess: () => {
      toast.success("Tag removida do chamado")
      void utils.formResponse.listKanBan.invalidate()
      void utils.formResponse.getTags.invalidate()
    },
    onError: (err) => toast.error(err.message || "Erro ao remover tag"),
  })

  const fields = ((form?.fields as unknown as Field[]) ?? []).filter(Boolean)
  const responseObjects = Array.isArray(r.responses) ? r.responses : []
  const meta = STATUS_META[r.status]

  const responseTagIds = r.tags ?? []
  const assignedTags = allTags.filter((t) => responseTagIds.includes(t.id))

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.75)] backdrop-blur-sm">
      <div className="border-b border-[hsl(var(--v2-border-soft))] px-5 pb-3 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--v2-faint))]">
          <span className="font-mono">{shortId(r)}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-current opacity-60" aria-hidden />
          <span>{r.form?.title}</span>
        </div>
        <h2 className="my-2 text-lg font-semibold leading-tight tracking-tight">
          Solicitação de {fullName(r.user)}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={cn("gap-1.5 border-current", meta.text)}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                {meta.label}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {STATUS_ORDER.map((s) => {
                const m = STATUS_META[s]
                return (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => onStatusChange(r.id, s)}
                    className="gap-2"
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                    <span className={cn(s === r.status && "font-semibold")}>{m.label}</span>
                    {s === r.status && <Check className="ml-auto h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            onClick={() => onAssume(r.id, r.status)}
            className="bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] hover:bg-[hsl(var(--brand-accent)/.9)]"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            {r.status === "NOT_STARTED" ? "Assumir chamado" : "Estou atendendo"}
          </Button>

          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2)/.6)] p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--v2-faint))]">
              Solicitante
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={r.user?.imageUrl ?? ""} />
                <AvatarFallback className="text-xs">
                  {initials(r.user?.firstName, r.user?.lastName, r.user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{fullName(r.user)}</p>
                <p className="text-[11px] text-[hsl(var(--v2-faint))]">{r.user?.setor ?? "—"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2)/.6)] p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--v2-faint))]">
              Aberto há
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <strong className="text-sm font-semibold">
                {formatDistanceStrict(new Date(r.createdAt), new Date(), { locale: ptBR })}
              </strong>
            </div>
            <p className="mt-1 text-[11px] text-[hsl(var(--v2-faint))]">
              Última atividade {formatDistanceToNow(new Date(r.lastChatAt ?? r.updatedAt), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2)/.6)] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              Tags do Chamado
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
              onClick={onOpenTagsModal}
            >
              Gerenciar Tags
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {assignedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-2xs"
                style={{ backgroundColor: tag.cor || "#3B82F6" }}
              >
                <span>{tag.nome}</span>
                <button
                  type="button"
                  onClick={() => removeTagMutation.mutate({ responseId: r.id, tagId: tag.id })}
                  className="hover:opacity-75 rounded-full p-0.5 transition-opacity cursor-pointer"
                  title={`Remover tag ${tag.nome}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 rounded-full px-2.5 text-[11px] font-semibold gap-1 border-dashed border-border/80 bg-background/50 hover:bg-background"
                >
                  <Plus className="h-3 w-3" />
                  <span>Atribuir Tag</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {allTags.length === 0 ? (
                    <p className="p-2 text-xs text-muted-foreground text-center">Nenhuma tag cadastrada no sistema</p>
                  ) : (
                    allTags.map((tag) => {
                      const isAssigned = responseTagIds.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            if (isAssigned) {
                              removeTagMutation.mutate({ responseId: r.id, tagId: tag.id })
                            } else {
                              applyTagMutation.mutate({ responseId: r.id, tagId: tag.id })
                            }
                          }}
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.cor }} />
                            <span className="font-medium text-foreground">{tag.nome}</span>
                          </div>
                          {isAssigned && <Check className="h-3.5 w-3.5 text-primary" />}
                        </button>
                      )
                    })
                  )}
                </div>
                <div className="border-t mt-1.5 pt-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-[11px] h-7 px-2"
                    onClick={onOpenTagsModal}
                  >
                    <Tags className="mr-1.5 h-3 w-3 text-primary" />
                    Criar / editar tags…
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Dados da solicitação
        </div>
        <div className="mb-5 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2)/.6)] p-3">
          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem campos configurados para exibição.</p>
          ) : (
            <ResponseDetails responseData={responseObjects} formFields={fields.filter((f) => f.showInList !== false)} />
          )}
        </div>

        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Chat
        </div>
        <ResponseChat responseId={r.id} className="rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--v2-card-2)/.6)] p-3" />
      </div>
    </Card>
  )
}

export default CentralView
