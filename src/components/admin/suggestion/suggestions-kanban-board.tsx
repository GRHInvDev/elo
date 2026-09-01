"use client"

import {
  DragDropContext,
  Droppable,
  Draggable,
  type OnDragEndResponder,
} from "@hello-pangea/dnd"

import { AnimatedInteger } from "@/components/ui/animated-stat"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

function formatIdeaNumber(ideaNumber: number): string {
  return ideaNumber.toString().padStart(3, "0")
}

const COLUMN_HEADER_CONFIG: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "Ainda não avaliado": {
    bg: "bg-sky-100 dark:bg-[#182635]",
    text: "text-sky-800 dark:text-[#70b8e8]",
    border: "border-sky-300 dark:border-[#223d57]",
  },
  "Em avaliação": {
    bg: "bg-lime-100 dark:bg-[#25331e]",
    text: "text-lime-900 dark:text-[#a3e635]",
    border: "border-lime-300 dark:border-[#384c2c]",
  },
  "Em orçamento": {
    bg: "bg-amber-100 dark:bg-[#382d18]",
    text: "text-amber-900 dark:text-[#facc15]",
    border: "border-amber-300 dark:border-[#504122]",
  },
  "Em execução": {
    bg: "bg-yellow-100 dark:bg-[#3d3419]",
    text: "text-yellow-900 dark:text-[#fde047]",
    border: "border-yellow-300 dark:border-[#574a24]",
  },
  "Concluído": {
    bg: "bg-emerald-100 dark:bg-[#163b2c]",
    text: "text-emerald-900 dark:text-[#34d399]",
    border: "border-emerald-300 dark:border-[#20533e]",
  },
  "Não implantado": {
    bg: "bg-slate-200 dark:bg-[#262931]",
    text: "text-slate-800 dark:text-[#94a3b8]",
    border: "border-slate-300 dark:border-[#373c47]",
  },
}

/** Campos mínimos para renderizar um card do kanban de ideias */
export type SuggestionsKanbanCard = {
  id: string
  ideaNumber: number
  problem: string | null
  description?: string
  isNameVisible: boolean
  submittedName: string | null
  submittedSector: string | null
  createdAt: Date
  impact: { score?: number; text?: string } | null
  capacity: { score?: number; text?: string } | null
  effort: { score?: number; text?: string } | null
  payment: { status: "paid" | "unpaid" } | null
  campaign?: { id: string; name: string; status: string; isPrivate: boolean } | null
  user?: {
    firstName: string | null
    lastName: string | null
    email: string
    setor: string | null
    filial?: {
      id?: string
      name: string
      code?: string
    } | null
  } | null
}

export interface SuggestionsKanbanBoardProps<
  T extends SuggestionsKanbanCard = SuggestionsKanbanCard,
> {
  isLoading: boolean
  columnTitles: readonly string[]
  getStatusColor: (status: string) => string
  kanbanColumns: Record<string, T[]>
  onDragEnd: OnDragEndResponder
  onOpenSuggestion: (suggestion: T) => void
  /** Clique direito sobre um card — recebe a ideia e a posição do cursor. */
  onContextMenuSuggestion?: (suggestion: T, position: { x: number; y: number }) => void
}

const SKELETON_CARDS_PER_COLUMN = 3

function SuggestionsKanbanSkeleton({
  columnTitles,
  getStatusColor,
}: Pick<SuggestionsKanbanBoardProps, "columnTitles" | "getStatusColor">) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3 w-full min-w-0"
      aria-busy="true"
      aria-label="Carregando quadro kanban"
    >
      {columnTitles.map((st) => {
        const headerStyle = COLUMN_HEADER_CONFIG[st] ?? {
          bg: "bg-muted/40",
          text: "text-foreground",
          border: "border-border",
        }

        return (
          <div
            key={st}
            className={cn("rounded-lg border p-2 md:p-3 min-w-0 overflow-hidden", getStatusColor(st))}
          >
            <div
              className={cn(
                "rounded-md border px-2.5 py-1.5 flex items-center justify-between font-bold text-xs mb-2",
                headerStyle.bg,
                headerStyle.text,
                headerStyle.border
              )}
            >
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-4 w-6 bg-white/10" />
            </div>
            <div className="max-h-[400px] md:max-h-[600px] lg:max-h-[800px] overflow-y-auto space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {Array.from({ length: SKELETON_CARDS_PER_COLUMN }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card dark:border-[#222834] dark:bg-[#12161d] p-3 space-y-2 shadow-sm"
                >
                  <Skeleton className="h-3.5 w-full bg-muted-foreground/10" />
                  <Skeleton className="h-3 w-3/4 bg-muted-foreground/10" />
                  <Skeleton className="h-3 w-16 bg-muted-foreground/10 rounded" />
                  <div className="flex justify-between items-center pt-1 border-t border-border">
                    <Skeleton className="h-3 w-12 bg-muted-foreground/10" />
                    <Skeleton className="h-3 w-8 bg-muted-foreground/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Quadro kanban de ideias (gestão): colunas por status, drag-and-drop e skeleton de carregamento **dentro** do mesmo bloco visual do board.
 */
export function SuggestionsKanbanBoard<T extends SuggestionsKanbanCard>({
  isLoading,
  columnTitles,
  getStatusColor,
  kanbanColumns,
  onDragEnd,
  onOpenSuggestion,
  onContextMenuSuggestion,
}: SuggestionsKanbanBoardProps<T>) {
  if (isLoading) {
    return (
      <SuggestionsKanbanSkeleton
        columnTitles={columnTitles}
        getStatusColor={getStatusColor}
      />
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3 w-full min-w-0">
        {columnTitles.map((st, columnIndex) => {
          const headerStyle = COLUMN_HEADER_CONFIG[st] ?? {
            bg: "bg-muted/40",
            text: "text-foreground",
            border: "border-border",
          }

          return (
            <Droppable droppableId={st} key={st}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-lg border p-2 md:p-2.5 ${getStatusColor(st)} flex flex-col min-w-0 overflow-hidden`}
                >
                  {/* Header Coluna (Pill Arredondada estilizada) */}
                  <div
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 font-bold text-xs flex items-center justify-between mb-2 shadow-sm select-none",
                      headerStyle.bg,
                      headerStyle.text,
                      headerStyle.border
                    )}
                  >
                    <span className="truncate text-[12px]" title={st}>
                      {st}
                    </span>
                    <span className="opacity-85 ml-1.5 font-semibold tabular-nums text-[11px] shrink-0">
                      (
                      <AnimatedInteger
                        value={kanbanColumns[st]?.length ?? 0}
                        delayMs={columnIndex * 60}
                        durationMs={700}
                      />
                      )
                    </span>
                  </div>

                  <div className="max-h-[500px] md:max-h-[650px] lg:max-h-[800px] overflow-y-auto space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {kanbanColumns[st]?.map((s, index) => {
                      const impactData = s.impact
                      const capacityData = s.capacity
                      const effortData = s.effort

                      const impactScore = impactData?.score ?? 0
                      const capacityScore = capacityData?.score ?? 0
                      const effortScore = effortData?.score ?? 0
                      const pontuacao = Math.max(
                        0,
                        impactScore + capacityScore - effortScore
                      )

                      const ideaTitleText = s.problem?.trim()
                        ? s.description?.trim() ?? "Ideia sem descrição"
                        : s.description?.trim() ?? "Ideia sem descrição"

                      const authorNameText = s.isNameVisible
                        ? (s.submittedName ?? (s.user ? `${s.user.firstName ?? ""} ${s.user.lastName ?? ""}`.trim() || s.user.email : "Não informado"))
                        : "Nome oculto"

                      const sectorText = s.isNameVisible ? (s.submittedSector ?? s.user?.setor ?? null) : null
                      const unitText = s.isNameVisible ? (s.user?.filial?.name ?? null) : null

                      return (
                        <Draggable draggableId={s.id} index={index} key={s.id}>
                          {(prov) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                            >
                              <div
                                className="rounded-lg border border-border/80 bg-card hover:bg-accent/40 hover:border-primary/40 dark:border-[#222834] dark:bg-[#12161d] dark:hover:bg-[#161c26] dark:hover:border-[#2f384a] p-2.5 transition-all duration-150 shadow-sm cursor-pointer select-none"
                                onClick={() => onOpenSuggestion(s)}
                                onContextMenu={(e) => {
                                  if (!onContextMenuSuggestion) return
                                  e.preventDefault()
                                  onContextMenuSuggestion(s, {
                                    x: e.clientX,
                                    y: e.clientY,
                                  })
                                }}
                              >
                                <div
                                  className="font-bold text-[12px] text-foreground dark:text-[#f1f5f9] truncate mb-0.5 leading-tight"
                                  title={ideaTitleText}
                                >
                                  <span className="text-primary font-mono mr-1">
                                    #{formatIdeaNumber(s.ideaNumber)} —
                                  </span>
                                  <span>{ideaTitleText}</span>
                                </div>

                                <div className="text-[10.5px] text-muted-foreground dark:text-[#94a3b8] font-medium truncate mb-1.5">
                                  {authorNameText}
                                </div>

                                <div className="mb-2 flex items-center gap-1 flex-wrap">
                                  {sectorText && (
                                    <span className="inline-block bg-muted text-foreground/80 border border-border/80 dark:bg-[#1e2633] dark:text-[#cbd5e1] dark:border-[#2d3748]/70 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide uppercase">
                                      {sectorText}
                                    </span>
                                  )}
                                  {s.campaign && (
                                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded text-[9px] font-medium truncate max-w-[120px]">
                                      <span className="truncate">{s.campaign.name}</span>
                                    </span>
                                  )}
                                </div>

                                {unitText && (
                                  <span className="inline-flex items-center rounded text-muted-foreground dark:text-[#a4aab3] text-[9px] mb-1">
                                    <span className="truncate max-w-[150px]">{unitText}</span>
                                  </span>
                                )}

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground dark:text-[#64748b] pt-1 border-t border-border/60 dark:border-[#1f2633]/80 mt-1">
                                  <span className="truncate max-w-[105px]">
                                    {s.createdAt
                                      ? format(
                                          new Date(s.createdAt),
                                          "dd 'de' MMM, HH:mm",
                                          { locale: ptBR }
                                        )
                                      : "Sem data"}
                                  </span>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="font-semibold text-foreground/80 dark:text-[#cbd5e1] text-[10px] bg-muted/70 dark:bg-[#1e2633] px-1.5 py-0.5 rounded border border-border/60 dark:border-[#2d3748]/60">
                                      {pontuacao} pts
                                    </span>
                                    {s.payment && (
                                      <span
                                        className={cn(
                                          "text-[9px] font-semibold px-1 py-0.5 rounded",
                                          s.payment.status === "paid"
                                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                        )}
                                      >
                                        {s.payment.status === "paid"
                                          ? "Pago"
                                          : "Não Pago"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          )
        })}
      </div>
    </DragDropContext>
  )
}
