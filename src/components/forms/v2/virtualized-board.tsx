"use client"

import * as React from "react"
import { List, type RowComponentProps } from "react-window"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { FormResponse, ResponseStatus } from "@/types/form-responses"
import { STATUS_META } from "./request-status-pill"

const CARD_HEIGHT = 168
const CARD_GAP = 8
const MAX_VISIBLE_CARDS = 6

const STATUS_ORDER: ResponseStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]

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

interface BoardCardRowProps {
  items: FormResponse[]
  onSelect: (id: string) => void
}

function BoardCardRow({ index, style, items, onSelect }: RowComponentProps<BoardCardRowProps>) {
  const r = items[index]
  if (!r) return null
  return (
    <div style={style} className="pr-1">
      <button
        type="button"
        onClick={() => onSelect(r.id)}
        style={{ height: CARD_HEIGHT - CARD_GAP }}
        className="flex w-full flex-col gap-2 rounded-xl border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card))] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--brand-accent)/.45)] hover:shadow-[var(--v2-shadow)]"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[hsl(var(--v2-faint))]">{shortId(r)}</span>
          {r.status === "NOT_STARTED" && (
            <span className="rounded bg-[hsl(0_72%_55%/.14)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[hsl(0_72%_55%)]">
              Novo
            </span>
          )}
        </div>
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
      </button>
    </div>
  )
}

interface VirtualizedBoardProps {
  responses: FormResponse[]
  onSelect: (id: string) => void
}

export function VirtualizedBoard({ responses, onSelect }: VirtualizedBoardProps) {
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {STATUS_ORDER.map((status) => {
        const meta = STATUS_META[status]
        const items = grouped[status]
        const visibleCards = Math.min(MAX_VISIBLE_CARDS, items.length)
        const listHeight = visibleCards * CARD_HEIGHT
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
            {items.length === 0 ? (
              <p className="rounded-md border border-dashed border-[hsl(var(--v2-border-soft))] p-3 text-center text-xs text-[hsl(var(--v2-faint))]">
                Sem itens
              </p>
            ) : (
              <div style={{ height: listHeight }} className="-mr-1">
                <List
                  rowCount={items.length}
                  rowHeight={CARD_HEIGHT}
                  defaultHeight={listHeight}
                  overscanCount={3}
                  rowComponent={BoardCardRow}
                  rowProps={{ items, onSelect }}
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
