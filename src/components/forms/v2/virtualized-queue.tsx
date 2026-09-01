"use client"

import * as React from "react"
import { List, type RowComponentProps } from "react-window"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, UserCheck } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { FormResponse } from "@/types/form-responses"
import { RequestStatusPill } from "./request-status-pill"

const ROW_HEIGHT = 128
const ROW_GAP = 8
const MAX_VISIBLE_ROWS = 7

interface VirtualizedQueueProps {
  responses: FormResponse[]
  activeId: string | null
  onSelect: (id: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

interface QueueRowProps {
  responses: FormResponse[]
  activeId: string | null
  onSelect: (id: string) => void
  hasMore?: boolean
  isLoadingMore?: boolean
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

function QueueRow({
  index,
  style,
  responses,
  activeId,
  onSelect,
}: RowComponentProps<QueueRowProps>) {
  if (index >= responses.length) {
    return (
      <div style={style} className="pr-1 flex items-center justify-center">
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.4)] p-3 text-xs text-muted-foreground w-full">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Carregando mais chamados...</span>
        </div>
      </div>
    )
  }

  const r = responses[index]
  if (!r) return null
  const ageHours = (Date.now() - new Date(r.createdAt).getTime()) / 1000 / 3600
  const ageRisk = ageHours > 24 && r.status !== "COMPLETED"
  const isNew = r.status === "NOT_STARTED"
  const active = r.id === activeId
  return (
    <div style={style} className="pr-1">
      <button
        type="button"
        onClick={() => onSelect(r.id)}
        style={{ height: ROW_HEIGHT - ROW_GAP }}
        className={cn(
          "flex w-full gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer",
          active
            ? "border-[hsl(var(--brand-accent)/.55)] bg-[hsl(var(--brand-accent)/.07)] shadow-[inset_0_0_0_1px_hsl(var(--brand-accent)/.25)]"
            : "border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.8)] hover:border-border",
        )}
      >
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[hsl(var(--v2-faint))]">{shortId(r)}</span>
              {isNew && (
                <span className="rounded bg-[hsl(0_72%_55%/.14)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[hsl(0_72%_55%)]">
                  Novo
                </span>
              )}
              <span className="ml-auto">
                <RequestStatusPill status={r.status} size="sm" />
              </span>
            </div>
            <p className="my-1 line-clamp-1 text-[13px] font-medium leading-tight mb-1">
              {r.form?.title ?? "Sem título"}
            </p>
            
          </div>
          
          <div className="flex flex-col">
            {r.assignedTo ? (
              <div className="flex text-[10px] mt-1 -mb-1">
                <span className="font-light flex dark:text-gray-300 items-center gap-1 max-w-[170px]">
                  <UserCheck className="h-3 w-3 min-h-3 min-w-3" />
                  <span className="truncate">{r.assignedTo.name}</span>
                </span>
              </div>
            ) : (
              <div className="font-light flex dark:text-gray-300 text-[10px] mt-1 -mb-1">Sem atendente</div>
            )}
            <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-border/30 text-[11px] text-[hsl(var(--v2-faint))]">
              <div className="flex items-center flex-row max-w-[170px] -ml-0.5 truncate">
              <Avatar className="h-4 w-4 mr-1 shrink-0">
                <AvatarImage src={r.user?.imageUrl ?? ""} />
                <AvatarFallback className="text-[8px]">
                  {initials(r.user?.firstName, r.user?.lastName, r.user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{fullName(r.user)}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  ageRisk && "font-semibold text-[hsl(0_72%_58%)]",
                )}
              >
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(r.createdAt), { locale: ptBR, addSuffix: true })}
              </span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}

export function VirtualizedQueue({
  responses,
  activeId,
  onSelect,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: VirtualizedQueueProps) {
  if (responses.length === 0 && !isLoadingMore) {
    return (
      <p className="rounded-md border border-dashed border-[hsl(var(--v2-border-soft))] p-6 text-center text-xs text-muted-foreground">
        Nenhum chamado neste filtro.
      </p>
    )
  }

  const rowCount = responses.length + (hasMore ? 1 : 0)
  const visibleRows = Math.min(MAX_VISIBLE_ROWS, rowCount)
  const height = visibleRows * ROW_HEIGHT

  return (
    <div style={{ height }} className="-mr-1">
      <List
        rowCount={rowCount}
        rowHeight={ROW_HEIGHT}
        defaultHeight={height}
        overscanCount={3}
        rowComponent={QueueRow}
        rowProps={{ responses, activeId, onSelect, hasMore, isLoadingMore }}
        style={{ height: "100%", width: "100%" }}
        onRowsRendered={({ stopIndex }) => {
          if (stopIndex >= responses.length - 2 && hasMore && !isLoadingMore && onLoadMore) {
            onLoadMore()
          }
        }}
        className="scrollbar-hide"
      />
    </div>
  )
}
