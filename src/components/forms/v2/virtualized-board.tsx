"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type OnDragEndResponder,
} from "@hello-pangea/dnd"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import type { FormResponse, ResponseStatus } from "@/types/form-responses"
import { STATUS_META } from "./request-status-pill"
import { ResponseContextMenu } from "@/app/(authenticated)/forms/kanban/_components/tags-context-menu"

const STATUS_ORDER: ResponseStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]

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
  onSelect: (id: string) => void
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
      void utils.formResponse.listKanBan.invalidate()
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
        onClick={() => onSelect(r.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelect(r.id)
          }
        }}
        onContextMenu={handleContextMenu}
        className={cn(
          "flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card))] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--brand-accent)/.45)] hover:shadow-[var(--v2-shadow)]",
          isDragging && "border-[hsl(var(--brand-accent)/.6)] shadow-[var(--v2-shadow)]",
        )}
      >
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
          <div className="flex flex-wrap gap-1">
            {appliedTags.map((tag) => (
              <span
                key={tag.id}
                className="group inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: tag.cor ?? "hsl(var(--muted-foreground))" }}
              >
                <span className="max-w-[120px] truncate">{tag.nome}</span>
                <button
                  type="button"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
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

        <p className="line-clamp-2 text-[13px] font-medium leading-snug">
          {r.form?.title ?? "Sem título"}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--v2-faint))]">
          <Avatar className="h-4 w-4">
            <AvatarImage src={r.user?.imageUrl ?? ""} />
            <AvatarFallback className="text-[8px]">
              {initials(r.user?.firstName, r.user?.lastName, r.user?.email)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{fullName(r.user)}</span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-[hsl(var(--v2-border-soft))] pt-2 text-[11px] text-[hsl(var(--v2-faint))]">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(r.createdAt), { locale: ptBR, addSuffix: true })}
          </span>
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
          onTagChange={() => void utils.formResponse.listKanBan.invalidate()}
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

interface VirtualizedBoardProps {
  responses: FormResponse[]
  availableTags?: AvailableTag[]
  onSelect: (id: string) => void
  onDragEnd: OnDragEndResponder
  onOpenDetails: (id: string) => void
  onEdit?: (id: string, formId: string) => void
  onOpenChat?: (id: string) => void
  onMoveToNextStatus?: (id: string, status: ResponseStatus) => void
  onOpenTagsManager?: () => void
}

export function VirtualizedBoard({
  responses,
  availableTags = [],
  onSelect,
  onDragEnd,
  onOpenDetails,
  onEdit,
  onOpenChat,
  onMoveToNextStatus,
  onOpenTagsManager,
}: VirtualizedBoardProps) {
  const grouped = React.useMemo(() => {
    const map: Record<ResponseStatus, FormResponse[]> = {
      NOT_STARTED: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    }
    for (const r of responses) map[r.status].push(r)
    return map
  }, [responses])

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-3">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status]
          const items = grouped[status]
          return (
            <Card
              key={status}
              className="flex min-h-0 flex-col border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.55)] p-3"
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-hidden />
                <span className="text-sm font-semibold">{meta.label}</span>
                <span className="ml-auto rounded-full bg-[hsl(var(--v2-card-2))] px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>

              <Droppable droppableId={status}>
                {(provided, dropSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex max-h-[calc(100vh-320px)] min-h-[120px] flex-col gap-2 overflow-y-auto rounded-lg p-0.5 transition-colors",
                      dropSnapshot.isDraggingOver && "bg-[hsl(var(--brand-accent)/.06)]",
                    )}
                  >
                    {items.length === 0 && !dropSnapshot.isDraggingOver ? (
                      <p className="rounded-md border border-dashed border-[hsl(var(--v2-border-soft))] p-3 text-center text-xs text-[hsl(var(--v2-faint))]">
                        Sem itens
                      </p>
                    ) : (
                      items.map((r, index) => (
                        <Draggable key={r.id} draggableId={r.id} index={index}>
                          {(dragProvided, dragSnapshot) => {
                            const node = (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{
                                  ...dragProvided.draggableProps.style,
                                  // Card arrastado sempre por cima de tudo (acima de overlays/glow).
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
                            // Enquanto arrasta, renderiza num portal no <body> para escapar de
                            // ancestrais com transform/backdrop-filter/overflow (que quebravam a
                            // posição do cursor e jogavam o card para trás das demais camadas).
                            if (dragSnapshot.isDragging && typeof document !== "undefined") {
                              return createPortal(node, document.body)
                            }
                            return node
                          }}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Card>
          )
        })}
      </div>
    </DragDropContext>
  )
}
