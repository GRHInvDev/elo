"use client"

import * as React from "react"
import { List, type RowComponentProps } from "react-window"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { FormResponse } from "@/types/form-responses"
import { RequestStatusPill } from "./request-status-pill"

const ROW_HEIGHT = 112
const ROW_GAP = 8
const MAX_VISIBLE_ROWS = 7

interface VirtualizedQueueProps {
  responses: FormResponse[]
  activeId: string | null
  onSelect: (id: string) => void
}

interface QueueRowProps {
  responses: FormResponse[]
  activeId: string | null
  onSelect: (id: string) => void
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
          "flex w-full gap-3 rounded-xl border p-3 text-left transition-all",
          active
            ? "border-[hsl(var(--brand-accent)/.55)] bg-[hsl(var(--brand-accent)/.07)] shadow-[inset_0_0_0_1px_hsl(var(--brand-accent)/.25)]"
            : "border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.8)] hover:border-border",
        )}
      >
        <span
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            r.status === "IN_PROGRESS" && "bg-[hsl(38_92%_55%)]",
            r.status === "COMPLETED" && "bg-[hsl(158_64%_45%)]",
            r.status === "NOT_STARTED" && "bg-[hsl(0_0%_55%)]",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
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
          <p className="my-1 line-clamp-2 text-[13px] font-medium leading-tight">
            {r.form?.title ?? "Sem título"}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--v2-faint))]">
            <Avatar className="h-4 w-4">
              <AvatarImage src={r.user?.imageUrl ?? ""} />
              <AvatarFallback className="text-[8px]">
                {initials(r.user?.firstName, r.user?.lastName, r.user?.email)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{fullName(r.user)}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-current opacity-60" aria-hidden />
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
      </button>
    </div>
  )
}

export function VirtualizedQueue({ responses, activeId, onSelect }: VirtualizedQueueProps) {
  if (responses.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[hsl(var(--v2-border-soft))] p-6 text-center text-xs text-muted-foreground">
        Nenhum chamado neste filtro.
      </p>
    )
  }

  const visibleRows = Math.min(MAX_VISIBLE_ROWS, responses.length)
  const height = visibleRows * ROW_HEIGHT

  return (
    <div style={{ height }} className="-mr-1">
      <List
        rowCount={responses.length}
        rowHeight={ROW_HEIGHT}
        defaultHeight={height}
        overscanCount={3}
        rowComponent={QueueRow}
        rowProps={{ responses, activeId, onSelect }}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  )
}
