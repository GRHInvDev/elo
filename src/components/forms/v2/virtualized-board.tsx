"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { List, type RowComponentProps } from "react-window"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type OnDragEndResponder,
} from "@hello-pangea/dnd"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, X, Loader2, UserCheck } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import type { FormResponse, ResponseStatus } from "@/types/form-responses"
import { STATUS_META } from "./request-status-pill"
import { ResponseContextMenu } from "./tags-context-menu"

const STATUS_ORDER: ResponseStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]
const CARD_HEIGHT = 148
const CARD_GAP = 8
const MAX_VISIBLE_CARDS = 5

interface AvailableTag {
  id: string
  nome: string
  cor?: string | null
}

function fullName(user?: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  if (!user) return "Sem solicitante"
  const a = user.firstName ?? ""
  const b = user.lastName ?? ""
  const name = `${a} ${b}`.trim()
  if (name.length > 0) return name
  return user.email ?? "—"
}

function initials(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const a = firstName?.[0]
  const b = lastName?.[0]
  if (a || b) return `${a ?? ""}${b ?? ""}`.toUpperCase() || "?"
  return (email?.[0] ?? "?").toUpperCase()
}

function shortId(r: FormResponse) {
  return r.number != null ? `#${r.number}` : `#${r.id.slice(0, 6)}`
}

interface BoardCardProps {
  response: FormResponse
  availableTags: AvailableTag[]
  isDragging: boolean
  onSelect?: (id: string) => void
  onOpenDetails: (id: string) => void
  onEdit?: (id: string, formId: string) => void
  onOpenChat?: (id: string) => void
  onMoveToNextStatus?: (id: string, status: ResponseStatus) => void
  onOpenTagsManager?: () => void
}

function BoardCard({
  response: r,
  availableTags,
  isDragging,
  onSelect,
  onOpenDetails,
  onEdit,
  onOpenChat,
  onMoveToNextStatus,
  onOpenTagsManager,
}: BoardCardProps) {
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null)
  const utils = api.useUtils()

  const removeTag = api.formResponse.removeTag.useMutation({
    onSuccess: () => {
      toast.success("Tag removida")
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.getQueueKpis.invalidate()
      void utils.formResponse.getTags.invalidate()
      void utils.formResponse.getChat.invalidate({ responseId: r.id })
      void utils.formResponse.getById.invalidate({ responseId: r.id })
    },
    onError: (error) => toast.error(error.message || "Erro ao remover tag"),
  })

  const handleContextMenu = (e: React.MouseEvent) => {
    // Apenas em desktop (não mobile)
    if (window.innerWidth >= 768) {
      e.preventDefault()
      e.stopPropagation()
      setContextMenu({ x: e.clientX, y: e.clientY })
    }
  }

  const appliedTags = r.tags
    ? availableTags.filter((tag) => r.tags?.includes(tag.id))
    : []

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(r.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelect?.(r.id)
          }
        }}
        onContextMenu={handleContextMenu}
        style={{ height: "100%" }}
        className={cn(
          "flex h-full w-full cursor-pointer flex-col justify-between rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card))] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--brand-accent)/.45)] hover:shadow-[var(--v2-shadow)] select-none",
          isDragging && "border-[hsl(var(--brand-accent)/.6)] shadow-[var(--v2-shadow)]",
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[hsl(var(--v2-faint))]">{shortId(r)}</span>
            {r.status === "NOT_STARTED" && (
              <span className="rounded bg-[hsl(0_72%_55%/.14)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[hsl(0_72%_55%)]">
                Novo
              </span>
            )}
            {r.hasNewMessages && (
              <span className="rounded bg-[hsl(var(--brand-accent)/.15)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[hsl(var(--brand-accent))]">
                Mensagem
              </span>
            )}
          </div>

          {appliedTags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {appliedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="group inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white shadow-2xs"
                  style={{ backgroundColor: tag.cor ?? "#3B82F6" }}
                >
                  <span className="max-w-[120px] truncate">{tag.nome}</span>
                  <button
                    type="button"
                    className="opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      removeTag.mutate({ responseId: r.id, tagId: tag.id })
                    }}
                    aria-label={`Remover tag ${tag.nome}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="my-1 line-clamp-2 text-[13px] font-medium leading-snug">
            {r.form?.title ?? "Sem título"}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-1.5 text-[11px] text-[hsl(var(--v2-faint))]">
            <div className="flex items-center gap-1.5 min-w-0 max-w-[140px] truncate">
              <Avatar className="h-4 w-4 shrink-0">
                <AvatarImage src={r.user?.imageUrl ?? ""} />
                <AvatarFallback className="text-[8px]">
                  {initials(r.user?.firstName, r.user?.lastName, r.user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{fullName(r.user)}</span>
            </div>

            {r.assignedTo && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[100px]" title={`Atendente: ${r.assignedTo.name}`}>
                <UserCheck className="h-3 w-3 shrink-0" />
                <span className="truncate">{r.assignedTo.name.split(" ")[0]}</span>
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-[hsl(var(--v2-border-soft))] pt-1.5 text-[11px] text-[hsl(var(--v2-faint))]">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(r.createdAt), { locale: ptBR, addSuffix: true })}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenDetails(r.id)
              }}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Abrir →
            </button>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ResponseContextMenu
          responseId={r.id}
          formId={r.formId}
          currentStatus={r.status}
          currentTags={r.tags ?? []}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onTagChange={() => {
            void utils.formResponse.listQueueInfinite.invalidate()
            void utils.formResponse.getQueueKpis.invalidate()
          }}
          onOpenDetails={onOpenDetails}
          onEdit={onEdit}
          onOpenChat={onOpenChat}
          onMoveToNextStatus={onMoveToNextStatus}
          onOpenTagsManager={onOpenTagsManager}
        />
      )}
    </>
  )
}

interface VirtualCardRowProps {
  items: FormResponse[]
  availableTags: AvailableTag[]
  hasMore?: boolean
  isFetchingMore?: boolean
  onSelect?: (id: string) => void
  onOpenDetails: (id: string) => void
  onEdit?: (id: string, formId: string) => void
  onOpenChat?: (id: string) => void
  onMoveToNextStatus?: (id: string, status: ResponseStatus) => void
  onOpenTagsManager?: () => void
}

function VirtualCardRow({
  index,
  style,
  items,
  availableTags,
  onSelect,
  onOpenDetails,
  onEdit,
  onOpenChat,
  onMoveToNextStatus,
  onOpenTagsManager,
}: RowComponentProps<VirtualCardRowProps>) {
  if (index >= items.length) {
    return (
      <div style={style} className="pr-1 pb-2 flex items-center justify-center">
        <div className="flex h-full w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.4)] p-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Carregando mais...</span>
        </div>
      </div>
    )
  }

  const r = items[index]
  if (!r) return null

  return (
    <div style={style} className="pr-1 pb-2">
      <Draggable key={r.id} draggableId={r.id} index={index}>
        {(dragProvided, dragSnapshot) => {
          const node = (
            <div
              ref={dragProvided.innerRef}
              {...dragProvided.draggableProps}
              {...dragProvided.dragHandleProps}
              style={{
                ...dragProvided.draggableProps.style,
                height: CARD_HEIGHT - CARD_GAP,
                zIndex: dragSnapshot.isDragging ? 9999 : undefined,
              }}
            >
              <BoardCard
                response={r}
                availableTags={availableTags}
                isDragging={dragSnapshot.isDragging}
                onSelect={onSelect}
                onOpenDetails={onOpenDetails}
                onEdit={onEdit}
                onOpenChat={onOpenChat}
                onMoveToNextStatus={onMoveToNextStatus}
                onOpenTagsManager={onOpenTagsManager}
              />
            </div>
          )
          if (dragSnapshot.isDragging && typeof document !== "undefined") {
            return createPortal(node, document.body)
          }
          return node
        }}
      </Draggable>
    </div>
  )
}

interface BoardColumnProps {
  status: ResponseStatus
  totalCount?: number
  tagIds?: string[]
  search?: string
  formIds?: string[]
  userIds?: string[]
  setores?: string[]
  startDate?: Date
  endDate?: Date
  number?: number
  hasResponse?: boolean
  priority?: "ASC" | "DESC"
  availableTags: AvailableTag[]
  onSelect?: (id: string) => void
  onOpenDetails: (id: string) => void
  onEdit?: (id: string, formId: string) => void
  onOpenChat?: (id: string) => void
  onMoveToNextStatus?: (id: string, status: ResponseStatus) => void
  onOpenTagsManager?: () => void
}

function BoardColumn({
  status,
  totalCount,
  tagIds,
  search,
  formIds,
  userIds,
  setores,
  startDate,
  endDate,
  number,
  hasResponse,
  priority,
  availableTags,
  onSelect,
  onOpenDetails,
  onEdit,
  onOpenChat,
  onMoveToNextStatus,
  onOpenTagsManager,
}: BoardColumnProps) {
  const query = api.formResponse.listQueueInfinite.useInfiniteQuery(
    {
      status,
      limit: 20,
      tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
      search: search ? search.trim() : undefined,
      formIds: formIds && formIds.length > 0 ? formIds : undefined,
      userIds: userIds && userIds.length > 0 ? userIds : undefined,
      setores: setores && setores.length > 0 ? setores : undefined,
      startDate,
      endDate,
      number,
      hasResponse,
      priority: priority ?? "DESC",
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  )

  const items = React.useMemo(() => {
    return (query.data?.pages.flatMap((page) => page.items) ?? []) as unknown as FormResponse[]
  }, [query.data])

  const meta = STATUS_META[status]
  const count = totalCount ?? items.length
  const hasMore = !!query.hasNextPage
  const isFetchingMore = query.isFetchingNextPage

  const rowCount = items.length + (hasMore ? 1 : 0)
  const visibleCards = Math.max(1, Math.min(MAX_VISIBLE_CARDS, rowCount || 1))
  const height = items.length === 0 && !query.isLoading ? 120 : visibleCards * CARD_HEIGHT

  return (
    <Card
      key={status}
      className="flex min-h-0 flex-col border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.55)] p-3"
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-hidden />
        <span className="text-sm font-semibold">{meta.label}</span>
        <span className="ml-auto rounded-full bg-[hsl(var(--v2-card-2))] px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {count}
        </span>
      </div>

      <Droppable
        droppableId={status}
        mode="virtual"
        renderClone={(provided, snapshot, rubric) => {
          const item = items[rubric.source.index]
          if (!item) return null
          return (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                height: CARD_HEIGHT - CARD_GAP,
                zIndex: 9999,
              }}
            >
              <BoardCard
                response={item}
                availableTags={availableTags}
                isDragging={snapshot.isDragging}
                onSelect={onSelect}
                onOpenDetails={onOpenDetails}
                onEdit={onEdit}
                onOpenChat={onOpenChat}
                onMoveToNextStatus={onMoveToNextStatus}
                onOpenTagsManager={onOpenTagsManager}
              />
            </div>
          )
        }}
      >
        {(provided, dropSnapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ height, maxHeight: "calc(100vh - 320px)" }}
            className={cn(
              "flex flex-col rounded-lg p-0.5 transition-colors -mr-1",
              dropSnapshot.isDraggingOver && "bg-[hsl(var(--brand-accent)/.06)]",
            )}
          >
            {query.isLoading ? (
              <div className="flex flex-col gap-2 p-2">
                <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
                <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
              </div>
            ) : items.length === 0 && !dropSnapshot.isDraggingOver ? (
              <p className="rounded-md border border-dashed border-[hsl(var(--v2-border-soft))] p-6 text-center text-xs text-[hsl(var(--v2-faint))]">
                Sem itens
              </p>
            ) : (
              <List
                rowCount={rowCount}
                rowHeight={CARD_HEIGHT}
                defaultHeight={height}
                overscanCount={2}
                rowComponent={VirtualCardRow}
                rowProps={{
                  items,
                  availableTags,
                  hasMore,
                  isFetchingMore,
                  onSelect,
                  onOpenDetails,
                  onEdit,
                  onOpenChat,
                  onMoveToNextStatus,
                  onOpenTagsManager,
                }}
                style={{ height: "100%", width: "100%" }}
                onRowsRendered={({ stopIndex }) => {
                  if (stopIndex >= items.length - 2 && hasMore && !isFetchingMore) {
                    void query.fetchNextPage()
                  }
                }}
              />
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </Card>
  )
}

export interface VirtualizedBoardProps {
  tagIds?: string[]
  search?: string
  formIds?: string[]
  userIds?: string[]
  setores?: string[]
  startDate?: Date
  endDate?: Date
  number?: number
  hasResponse?: boolean
  priority?: "ASC" | "DESC"
  onSelect?: (id: string) => void
  onOpenDetails: (id: string) => void
  onEdit?: (id: string, formId: string) => void
  onOpenChat?: (id: string) => void
  onMoveToNextStatus?: (id: string, status: ResponseStatus) => void
  onOpenTagsManager?: () => void
}

export function VirtualizedBoard({
  tagIds,
  search,
  formIds,
  userIds,
  setores,
  startDate,
  endDate,
  number,
  hasResponse,
  priority,
  onSelect,
  onOpenDetails,
  onEdit,
  onOpenChat,
  onMoveToNextStatus,
  onOpenTagsManager,
}: VirtualizedBoardProps) {
  const { data: kpisData } = api.formResponse.getQueueKpis.useQuery({
    tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
    formIds: formIds && formIds.length > 0 ? formIds : undefined,
    userIds: userIds && userIds.length > 0 ? userIds : undefined,
    setores: setores && setores.length > 0 ? setores : undefined,
    startDate,
    endDate,
    search: search ? search.trim() : undefined,
    number,
    hasResponse,
  })

  const { data: availableTags = [] } = api.formResponse.getTags.useQuery()
  const utils = api.useUtils()

  const updateStatus = api.formResponse.updateStatus.useMutation({
    onSuccess: () => {
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.getQueueKpis.invalidate()
    },
    onError: (err) => toast.error(`Não foi possível atualizar: ${err.message}`),
  })

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const newStatus = destination.droppableId as ResponseStatus
    updateStatus.mutate({ responseId: draggableId, status: newStatus })
    toast.success(`Chamado movido para ${STATUS_META[newStatus].label}`)
  }

  const counts: Record<ResponseStatus, number> = {
    NOT_STARTED: kpisData?.notStarted ?? 0,
    IN_PROGRESS: kpisData?.inProgress ?? 0,
    COMPLETED: kpisData?.done ?? 0,
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
        {STATUS_ORDER.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            totalCount={counts[status]}
            tagIds={tagIds}
            search={search}
            formIds={formIds}
            userIds={userIds}
            setores={setores}
            startDate={startDate}
            endDate={endDate}
            number={number}
            hasResponse={hasResponse}
            priority={priority}
            availableTags={availableTags}
            onSelect={onSelect}
            onOpenDetails={onOpenDetails}
            onEdit={onEdit}
            onOpenChat={onOpenChat}
            onMoveToNextStatus={onMoveToNextStatus}
            onOpenTagsManager={onOpenTagsManager}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
