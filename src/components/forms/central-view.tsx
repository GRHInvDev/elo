"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { formatDistanceToNow, formatDistanceStrict } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Edit,
  Filter,
  Inbox,
  KanbanSquare,
  List as ListIcon,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Tags,
  UserCheck,
  UserPlus,
  UserX,
  X,
  Zap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
import { STATUS_META } from "@/components/forms/request-status-pill"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { VirtualizedQueue } from "@/components/forms/virtualized-queue"
import { VirtualizedBoard } from "@/components/forms/virtualized-board"
import { TagsManagerModal } from "@/components/forms/tags-manager-modal"
import { EditResponseModal } from "@/components/forms/edit-response-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const searchParams = useSearchParams()
  const responseIdParam = searchParams.get("responseId")
  const formIdParam = searchParams.get("formId")

  const [view, setView] = React.useState<View>("fila")
  const [tab, setTab] = React.useState<Tab>("ALL")
  const [query, setQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState<string | null>(responseIdParam)
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([])
  const [hasResponseFilter, setHasResponseFilter] = React.useState<boolean | undefined>(undefined)
  const [tagsModalOpen, setTagsModalOpen] = React.useState(false)
  const [editResponseId, setEditResponseId] = React.useState<string | null>(null)
  const [editFormId, setEditFormId] = React.useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [sidebarVisible, setSidebarVisible] = React.useState(true)

  React.useEffect(() => {
    if (responseIdParam) {
      setSelectedId(responseIdParam)
    }
  }, [responseIdParam])

  const { toast } = useToast()
  const utils = api.useUtils()
  const { data: kpisData } = api.formResponse.getQueueKpis.useQuery({
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    formIds: formIdParam ? [formIdParam] : undefined,
    search: query.trim() || undefined,
    hasResponse: hasResponseFilter,
  })

  const infiniteQueue = api.formResponse.listQueueInfinite.useInfiniteQuery(
    {
      limit: 25,
      status: tab !== "ALL" ? tab : undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      formIds: formIdParam ? [formIdParam] : undefined,
      search: query.trim() || undefined,
      hasResponse: hasResponseFilter,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: view === "fila",
    },
  )

  const { data: availableTags = [] } = api.formResponse.getTags.useQuery()

  const queueResponses = React.useMemo(() => {
    return (infiniteQueue.data?.pages.flatMap((page) => page.items) ?? []) as unknown as FormResponse[]
  }, [infiniteQueue.data])

  const responses = queueResponses
  const isLoading = infiniteQueue.isLoading

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const filtered = queueResponses

  // Caso o chamado selecionado pela URL não esteja na 1ª página da fila
  const cleanSelectedNum = selectedId ? selectedId.replace(/^#/, "") : ""
  const isSelectedInQueue = !!selectedId && queueResponses.some(
    (r) => r.id === selectedId || (r.number != null && String(r.number) === cleanSelectedNum),
  )
  const needsFallbackFetch = !!selectedId && !isSelectedInQueue
  const { data: fallbackResponse } = api.formResponse.getById.useQuery(
    { responseId: selectedId ?? "" },
    { enabled: needsFallbackFetch },
  )

  const currentResponse = React.useMemo(() => {
    if (!selectedId) return null
    return (
      responses.find((r) => r.id === selectedId || (r.number != null && String(r.number) === cleanSelectedNum)) ??
      (fallbackResponse ? (fallbackResponse as unknown as FormResponse) : null)
    )
  }, [responses, selectedId, fallbackResponse, cleanSelectedNum])

  const counts = kpisData ?? {
    notStarted: 0,
    inProgress: 0,
    done: 0,
    recentDone: 0,
    aging: 0,
  }

  const updateStatus = api.formResponse.updateStatus.useMutation({
    onSuccess: () => {
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.listKanBan.invalidate()
      void utils.formResponse.getQueueKpis.invalidate()
      void utils.formResponse.getChat.invalidate()
      void utils.formResponse.getById.invalidate()
    },
    onError: (err) => toast({
      title: "Erro ao atualizar status",
      description: err.message,
      variant: "destructive",
    }),
  })

  const assumeMutation = api.formResponse.assumeResponse.useMutation({
    onSuccess: () => {
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.listKanBan.invalidate()
      void utils.formResponse.getQueueKpis.invalidate()
      void utils.formResponse.getChat.invalidate()
      void utils.formResponse.getById.invalidate()
    },
    onError: (err) => toast({
      title: "Erro ao assumir chamado",
      description: err.message,
      variant: "destructive",
    }),
  })

  const unassignMutation = api.formResponse.unassignResponse.useMutation({
    onSuccess: () => {
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.listKanBan.invalidate()
      void utils.formResponse.getQueueKpis.invalidate()
      void utils.formResponse.getChat.invalidate()
      void utils.formResponse.getById.invalidate()
    },
    onError: (err) => toast({
      title: "Erro ao liberar chamado",
      description: err.message,
      variant: "destructive",
    }),
  })

  const [completionTarget, setCompletionTarget] = React.useState<{ responseId: string } | null>(null)
  const [completionComment, setCompletionComment] = React.useState("")

  function handleStatusChange(id: string, status: ResponseStatus) {
    if (currentResponse?.id === id && currentResponse.status === status) {
      return
    }
    if (status === "COMPLETED") {
      const existing = currentResponse?.id === id ? (currentResponse.statusComment ?? "") : ""
      setCompletionComment(existing)
      setCompletionTarget({ responseId: id })
      return
    }
    updateStatus.mutate({ responseId: id, status })
  }

  function handleAssume(id: string, attendantUserId?: string) {
    assumeMutation.mutate({ responseId: id, attendantUserId })
  }

  function handleUnassign(id: string) {
    unassignMutation.mutate({ responseId: id })
  }

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
      if (nextStatus === "COMPLETED") {
        const existing = currentResponse?.id === id ? (currentResponse.statusComment ?? "") : ""
        setCompletionComment(existing)
        setCompletionTarget({ responseId: id })
        return
      }
      updateStatus.mutate({ responseId: id, status: nextStatus })
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/forms"
            className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Link>
          <div className="flex items-center gap-2.5">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Novos" value={counts.notStarted} />
        <Kpi label="Em progresso" value={counts.inProgress} tone="warn" />
        <Kpi label="Aguardando +24h" value={counts.aging} tone={counts.aging > 0 ? "danger" : undefined} />
        <Kpi label="Resolvidos hoje" value={counts.recentDone} tone="accent" />
      </div>

      <div className="flex w-full items-center gap-2 bg-[hsl(var(--card)/.45)] border border-[hsl(var(--forms-border-soft))] p-2 rounded-xl">
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº (#0001), solicitante, formulário..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs bg-background w-full"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select
          value={
            hasResponseFilter === undefined
              ? "all"
              : hasResponseFilter
                ? "responded"
                : "not_responded"
          }
          onValueChange={(value) => {
            setHasResponseFilter(
              value === "all"
                ? undefined
                : value === "responded"
                  ? true
                  : false,
            )
          }}
        >
          <SelectTrigger className="h-9 w-40 sm:w-48 shrink-0 text-xs bg-background">
            <SelectValue placeholder="Atendimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos os chamados</SelectItem>
            <SelectItem value="responded" className="text-xs">Respondidos</SelectItem>
            <SelectItem value="not_responded" className="text-xs">Sem resposta</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "relative h-9 shrink-0 text-xs gap-1.5 bg-background",
                selectedTagIds.length > 0 && "border-[hsl(var(--brand-accent)/.5)] text-[hsl(var(--brand-accent))]",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Tags</span>
              {selectedTagIds.length > 0 && (
                <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--brand-accent))] px-1 text-[10px] font-bold text-[hsl(var(--brand-accent-foreground))]">
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
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
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
                className="w-full justify-start text-xs cursor-pointer"
                onClick={() => setTagsModalOpen(true)}
              >
                <Tags className="mr-2 h-3.5 w-3.5" />
                Gerenciar tags…
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {(query || hasResponseFilter !== undefined || selectedTagIds.length > 0) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 shrink-0 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 cursor-pointer"
            onClick={() => {
              setQuery("")
              setHasResponseFilter(undefined)
              setSelectedTagIds([])
            }}
            title="Limpar filtros"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>
        )}
      </div>

      {selectedTagIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 -mt-1">
          {selectedTagIds.map((id) => {
            const t = availableTags.find((tag) => tag.id === id)
            if (!t) return null
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--forms-border-soft))] bg-[hsl(var(--forms-card-2))] px-2.5 py-1 text-[11px]"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: t.cor ?? "hsl(var(--muted-foreground))" }}
                  aria-hidden
                />
                {t.nome}
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
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

      {view === "fila" ? (
        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-1 gap-4 transition-all duration-200",
            sidebarVisible ? "lg:grid-cols-[372px_1fr]" : "lg:grid-cols-1",
          )}
        >
          {sidebarVisible && (
            <div className="flex min-h-0 flex-col">
              <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-3 w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/60 p-1 rounded-xl h-auto">
                  <TabsTrigger
                    value="ALL"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg py-1.5 text-xs font-semibold"
                  >
                    Todos
                  </TabsTrigger>
                  <TabsTrigger
                    value="NOT_STARTED"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg py-1.5 text-xs font-semibold"
                  >
                    Novos
                  </TabsTrigger>
                  <TabsTrigger
                    value="IN_PROGRESS"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg py-1.5 text-xs font-semibold"
                  >
                    Andamento
                  </TabsTrigger>
                  <TabsTrigger
                    value="COMPLETED"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg py-1.5 text-xs font-semibold"
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
                    onSelect={handleSelect}
                    onLoadMore={() => void infiniteQueue.fetchNextPage()}
                    hasMore={!!infiniteQueue.hasNextPage}
                    isLoadingMore={infiniteQueue.isFetchingNextPage}
                  />
                )}
              </div>
            </div>
          )}

          {currentResponse ? (
            <RequestDetail
              response={currentResponse}
              sidebarVisible={sidebarVisible}
              onToggleSidebar={() => setSidebarVisible((v) => !v)}
              onStatusChange={handleStatusChange}
              onAssume={handleAssume}
              onUnassign={handleUnassign}
              onOpenTagsModal={() => setTagsModalOpen(true)}
              onClose={() => setSelectedId(null)}
              onEdit={handleEdit}
            />
          ) : (
            <Card className="flex flex-col items-center justify-center gap-3 border-[hsl(var(--forms-border-soft))] p-10 text-center text-muted-foreground bg-card/60 backdrop-blur-sm">
              <Inbox className="h-10 w-10 opacity-40" />
              <p className="text-sm">Selecione um chamado na fila para começar a atender.</p>
              {!sidebarVisible && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarVisible(true)}
                  className="mt-2 text-xs gap-1.5 rounded-xl"
                >
                  <PanelLeftOpen className="h-3.5 w-3.5 text-primary" />
                  <span>Mostrar fila</span>
                </Button>
              )}
            </Card>
          )}
        </div>
      ) : (
        <VirtualizedBoard
          tagIds={selectedTagIds}
          search={query}
          hasResponse={hasResponseFilter}
          onSelect={handleOpenDetails}
          onOpenDetails={handleOpenDetails}
          onEdit={handleEdit}
          onOpenChat={handleOpenDetails}
          onMoveToNextStatus={handleMoveToNextStatus}
          onOpenTagsManager={() => setTagsModalOpen(true)}
        />
      )}

      <Dialog
        open={!!completionTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCompletionTarget(null)
            setCompletionComment("")
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
              </span>
              <DialogTitle className="text-base font-bold">Concluir Atendimento</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Para concluir esta solicitação, informe a resolução ou mensagem final para o solicitante. Esta informação será enviada por e-mail e ficará visível em &quot;Minhas Solicitações&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="conclusion-comment" className="text-xs font-semibold flex items-center justify-between">
              <span>Mensagem de Conclusão / Resolução <span className="text-destructive">*</span></span>
              <span className="text-[10px] text-muted-foreground font-normal">Obrigatório</span>
            </Label>
            <Textarea
              id="conclusion-comment"
              value={completionComment}
              onChange={(e) => setCompletionComment(e.target.value)}
              placeholder="Ex: Solicitação atendida com sucesso. O material foi entregue ao setor e o chamado finalizado."
              rows={4}
              className="resize-none text-xs rounded-xl border-border/80 focus-visible:ring-primary"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => {
                setCompletionTarget(null)
                setCompletionComment("")
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 bg-primary shadow-sm"
              disabled={!completionComment.trim() || updateStatus.isPending}
              onClick={() => {
                if (!completionTarget || !completionComment.trim()) return
                updateStatus.mutate({
                  responseId: completionTarget.responseId,
                  status: "COMPLETED",
                  statusComment: completionComment.trim(),
                })
                setCompletionTarget(null)
                setCompletionComment("")
              }}
            >
              <Check className="h-3.5 w-3.5" />
              <span>{updateStatus.isPending ? "Concluindo..." : "Confirmar Conclusão"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TagsManagerModal
        open={tagsModalOpen}
        onOpenChange={setTagsModalOpen}
      />

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
    <div className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 px-4 py-3.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs">
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
          className="flex animate-pulse gap-3 rounded-xl border border-[hsl(var(--forms-border-soft))] bg-[hsl(var(--card)/.8)] p-3"
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
  sidebarVisible?: boolean
  onToggleSidebar?: () => void
  onStatusChange: (id: string, status: ResponseStatus) => void
  onAssume: (id: string, attendantUserId?: string) => void
  onUnassign: (id: string) => void
  onOpenTagsModal: () => void
  onClose?: () => void
  onEdit?: (responseId: string, formId: string) => void
}

function RequestDetail({
  response: r,
  sidebarVisible = true,
  onToggleSidebar,
  onStatusChange,
  onAssume,
  onUnassign,
  onOpenTagsModal,
  onClose,
  onEdit,
}: RequestDetailProps) {
  const { toast } = useToast()
  const { data: form } = api.form.getById.useQuery({ id: r.formId })
  const { data: allTags = [] } = api.formResponse.getAllTags.useQuery()
  const { data: responsibles = [] } = api.formResponse.getFormResponsibles.useQuery(
    { formId: r.formId },
    { enabled: !!r.formId },
  )
  const utils = api.useUtils()

  const applyTagMutation = api.formResponse.applyTag.useMutation({
    onSuccess: () => {
      toast({
        title: "Tag aplicada ao chamado",
      })
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.listKanBan.invalidate()
      void utils.formResponse.getTags.invalidate()
      void utils.formResponse.getChat.invalidate({ responseId: r.id })
      void utils.formResponse.getById.invalidate({ responseId: r.id })
    },
    onError: (err) => toast({
      title: "Erro ao aplicar tag",
      description: err.message,
      variant: "destructive",
    }),
  })

  const removeTagMutation = api.formResponse.removeTag.useMutation({
    onSuccess: () => {
      toast({
        title: "Tag removida do chamado",
      })
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.listKanBan.invalidate()
      void utils.formResponse.getTags.invalidate()
      void utils.formResponse.getChat.invalidate({ responseId: r.id })
      void utils.formResponse.getById.invalidate({ responseId: r.id })
    },
    onError: (err) => toast({
      title: "Erro ao remover tag",
      description: err.message,
      variant: "destructive",
    }),
  })

  const [isEditingComment, setIsEditingComment] = React.useState(false)
  const [commentText, setCommentText] = React.useState(r.statusComment ?? "")

  React.useEffect(() => {
    setCommentText(r.statusComment ?? "")
  }, [r.statusComment])

  const updateCommentMutation = api.formResponse.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Nota salva",
        description: "A nota do chamado foi atualizada.",
      })
      setIsEditingComment(false)
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.getById.invalidate({ responseId: r.id })
    },
    onError: (err) => toast({
      title: "Erro ao salvar nota",
      description: err.message,
      variant: "destructive",
    }),
  })

  const fields = ((form?.fields as unknown as Field[]) ?? []).filter(Boolean)
  const responseObjects = Array.isArray(r.responses) ? r.responses : []
  const meta = STATUS_META[r.status]

  const responseTagIds = r.tags ?? []
  const assignedTags = allTags.filter((t) => responseTagIds.includes(t.id))

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden border-[hsl(var(--forms-border-soft))] bg-[hsl(var(--card)/.75)] backdrop-blur-sm shadow-sm">
      <div className="border-b border-[hsl(var(--forms-border-soft))] px-4 sm:px-5 pb-3 pt-3.5 flex items-stretch gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="group -my-3.5 -ml-4 sm:-ml-5 flex self-stretch items-center justify-center px-3.5 border-r border-[hsl(var(--forms-border-soft))] bg-muted/20 hover:bg-muted/60 text-muted-foreground hover:text-primary transition-all cursor-pointer"
          title="Mostrar lista lateral de chamados"
        >
          {sidebarVisible ? (
            <PanelLeftClose className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
          ) : (
            <PanelLeftOpen className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
          )}
        </button>
          
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--forms-faint))]">
                <span className="font-mono font-bold text-primary">{shortId(r)}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-current opacity-60" aria-hidden />
                <span>{r.form?.title}</span>
              </div>
              <h2 className="my-1 text-lg font-semibold leading-tight tracking-tight truncate">
                Solicitação de {fullName(r.user)}
              </h2>
            </div>
            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-lg cursor-pointer"
                onClick={onClose}
                title="Fechar detalhes"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("gap-1.5 border-current", meta.text)}
                >
                  {meta.label}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {STATUS_ORDER.map((s) => {
                  const m = STATUS_META[s]
                  const isCurrent = s === r.status
                  return (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => {
                        if (!isCurrent) {
                          onStatusChange(r.id, s)
                        }
                      }}
                      className={cn("gap-2 cursor-pointer", isCurrent && "bg-muted/40 font-semibold cursor-default")}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                      <span>{m.label}</span>
                      {isCurrent && <Check className="ml-auto h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {r.assignedTo ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-primary/40 bg-primary/10 text-primary font-semibold hover:bg-primary/20 cursor-pointer"
                    title="Gerenciar atendente deste chamado"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Atendente: {r.assignedTo.name.split(" ")[0]}</span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-1.5">
                  <DropdownMenuItem
                    onClick={() => onAssume(r.id)}
                    className="text-xs font-semibold text-primary focus:text-primary focus:bg-primary/10 cursor-pointer py-2 px-2.5 flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 mb-1"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-2xs">
                      <Zap className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground">Assumir para mim</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Transferir atendimento para você</span>
                    </div>
                  </DropdownMenuItem>

                  {responsibles.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-xs cursor-pointer py-2 px-2.5 flex items-center gap-2 text-foreground rounded-md">
                          <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>Atribuir a outro responsável</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-64 p-1.5">
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Selecione o responsável
                          </div>
                          {responsibles.map((resp) => {
                            const isCurrent = r.assignedTo?.userId === resp.id
                            const respName = resp.firstName
                              ? `${resp.firstName}${resp.lastName ? ` ${resp.lastName}` : ""}`.trim()
                              : resp.email
                            return (
                              <DropdownMenuItem
                                key={resp.id}
                                onClick={() => onAssume(r.id, resp.id)}
                                className="flex items-center justify-between gap-2.5 text-xs cursor-pointer py-2 px-2 rounded-md"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Avatar className="h-6 w-6 shrink-0 border border-border/40">
                                    <AvatarImage src={resp.imageUrl ?? ""} />
                                    <AvatarFallback className="text-[10px] font-bold">
                                      {initials(resp.firstName, resp.lastName, resp.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate font-medium">{respName}</span>
                                    {resp.setor && <span className="text-[10px] text-muted-foreground truncate">{resp.setor}</span>}
                                  </div>
                                </div>
                                {isCurrent && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </>
                  )}

                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={() => onUnassign(r.id)}
                    className="text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer py-2 px-2.5 flex items-center gap-2 rounded-md"
                  >
                    <UserX className="h-3.5 w-3.5 shrink-0" />
                    <span>Liberar chamado (Desatribuir)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="border border-primary bg-transparent text-primary font-semibold hover:bg-primary/20 cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Assumir chamado</span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-1.5">
                  <DropdownMenuItem
                    onClick={() => onAssume(r.id)}
                    className="text-xs font-semibold text-primary focus:text-primary focus:bg-primary/10 cursor-pointer py-2 px-2.5 flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 mb-1"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground">Assumir para mim</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Tornar-se o responsável imediato</span>
                    </div>
                  </DropdownMenuItem>

                  {responsibles.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-xs cursor-pointer py-2 px-2.5 flex items-center gap-2 text-foreground rounded-md">
                          <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>Atribuir para outro responsável</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-64 p-1.5">
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Selecione o responsável
                          </div>
                          {responsibles.map((resp) => {
                            const respName = resp.firstName
                              ? `${resp.firstName}${resp.lastName ? ` ${resp.lastName}` : ""}`.trim()
                              : resp.email
                            return (
                              <DropdownMenuItem
                                key={resp.id}
                                onClick={() => onAssume(r.id, resp.id)}
                                className="flex items-center gap-2.5 text-xs cursor-pointer py-2 px-2 rounded-md"
                              >
                                <Avatar className="h-6 w-6 shrink-0 border border-border/40">
                                  <AvatarImage src={resp.imageUrl ?? ""} />
                                  <AvatarFallback className="text-[10px] font-bold">
                                    {initials(resp.firstName, resp.lastName, resp.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate font-medium">{respName}</span>
                                  {resp.setor && <span className="text-[10px] text-muted-foreground truncate">{resp.setor}</span>}
                                </div>
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(r.id, r.formId)}
                className="gap-1.5 border-current bg-background/80 hover:bg-muted font-medium cursor-pointer"
                title="Editar respostas deste chamado"
              >
                <Edit className="h-3.5 w-3.5 text-primary" />
                <span>Editar</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[hsl(var(--forms-border-soft))] bg-[hsl(var(--forms-card-2)/.6)] p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--forms-faint))]">
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
                <p className="text-sm font-semibold truncate max-w-[180]">{fullName(r.user)}</p>
                <p className="text-[11px] text-[hsl(var(--forms-faint))]">{r.user?.setor ?? "—"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[hsl(var(--forms-border-soft))] bg-[hsl(var(--forms-card-2)/.6)] p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--forms-faint))]">
              Aberto há
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <strong className="text-sm font-semibold">
                {formatDistanceStrict(new Date(r.createdAt), new Date(), { locale: ptBR })}
              </strong>
            </div>
            <p className="mt-1 text-[11px] text-[hsl(var(--forms-faint))]">
              Última atividade {formatDistanceToNow(new Date(r.lastChatAt ?? r.updatedAt), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-[hsl(var(--forms-border-soft))] bg-[hsl(var(--forms-card-2)/.6)] p-3">
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

        {/* Bloco de Nota do Atendente / Mensagem de Conclusão */}
        <div className="mb-4 rounded-xl border border-[hsl(var(--forms-border-soft))] bg-[hsl(var(--forms-card-2)/.6)] p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              {r.status === "COMPLETED" ? "Mensagem de Conclusão / Resolução" : "Nota do Atendente para o Solicitante"}
            </span>
            {r.status !== "COMPLETED" && !isEditingComment && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                onClick={() => {
                  setCommentText(r.statusComment ?? "")
                  setIsEditingComment(true)
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                {r.statusComment ? "Editar Nota" : "Adicionar Nota"}
              </Button>
            )}
          </div>

          {isEditingComment ? (
            <div className="space-y-2 pt-1">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Insira uma observação ou mensagem para o solicitante (visível em Minhas Solicitações e enviada por e-mail)..."
                rows={3}
                className="resize-none text-xs rounded-lg border-border/80 bg-background/80"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs rounded-lg"
                  onClick={() => setIsEditingComment(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs font-semibold rounded-lg bg-primary text-primary-foreground"
                  disabled={updateCommentMutation.isPending}
                  onClick={() => {
                    updateCommentMutation.mutate({
                      responseId: r.id,
                      status: r.status,
                      statusComment: commentText.trim(),
                    })
                  }}
                >
                  {updateCommentMutation.isPending ? "Salvando..." : "Salvar Nota"}
                </Button>
              </div>
            </div>
          ) : r.statusComment ? (
            <div className="rounded-lg bg-background/60 border border-border/40 p-2.5 text-xs text-foreground leading-relaxed">
              {r.statusComment}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nenhuma nota adicionada ainda. {r.status !== "COMPLETED" && "Ao concluir o chamado, será obrigatório informar uma mensagem de resolução."}
            </p>
          )}
        </div>

        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Dados da solicitação
        </div>
        <div className="mb-5 rounded-xl border border-[hsl(var(--forms-border-soft))] bg-[hsl(var(--forms-card-2)/.6)] p-3">
          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem campos configurados para exibição.</p>
          ) : (
            <ResponseDetails responseData={responseObjects} formFields={fields.filter((f) => f.showInList !== false)} />
          )}
        </div>

        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Chat
        </div>
        <ResponseChat responseId={r.id} className="rounded-xl border border-[hsl(var(--forms-border-soft))] bg-[hsl(var(--forms-card-2)/.6)] p-3" />
      </div>
    </Card>
  )
}

export default CentralView