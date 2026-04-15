"use client"

import {
  DragDropContext,
  Droppable,
  Draggable,
  type OnDragEndResponder,
} from "@hello-pangea/dnd"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedInteger } from "@/components/ui/animated-stat"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function formatIdeaNumber(ideaNumber: number): string {
  return ideaNumber.toString().padStart(3, "0")
}

/** Campos mínimos para renderizar um card do kanban de ideias */
export type SuggestionsKanbanCard = {
  id: string
  ideaNumber: number
  problem: string | null
  isNameVisible: boolean
  submittedName: string | null
  submittedSector: string | null
  createdAt: Date
  impact: { score?: number; text?: string } | null
  capacity: { score?: number; text?: string } | null
  effort: { score?: number; text?: string } | null
  payment: { status: "paid" | "unpaid" } | null
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
}

const SKELETON_CARDS_PER_COLUMN = 3

function SuggestionsKanbanSkeleton({
  columnTitles,
  getStatusColor,
}: Pick<SuggestionsKanbanBoardProps, "columnTitles" | "getStatusColor">) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3"
      aria-busy="true"
      aria-label="Carregando quadro kanban"
    >
      {columnTitles.map((st) => (
        <div
          key={st}
          className={cn("rounded-lg border p-2 md:p-3", getStatusColor(st))}
        >
          <div className="font-medium mb-1 text-sm md:text-base flex items-center justify-between gap-2">
            <Skeleton className="h-4 flex-1 max-w-[min(12rem,85%)]" />
            <Skeleton className="h-3 w-8 shrink-0 rounded" />
          </div>
          <div className="max-h-[400px] md:max-h-[600px] lg:max-h-[800px] overflow-y-auto space-y-1 scrollbar-hide">
            {Array.from({ length: SKELETON_CARDS_PER_COLUMN }).map((_, i) => (
              <div
                key={i}
                className="rounded-md border bg-background/80 p-2 md:p-3 space-y-2"
              >
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-2 w-1/2" />
                <div className="flex justify-between items-center pt-1 gap-1">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3">
        {columnTitles.map((st, columnIndex) => (
          <Droppable droppableId={st} key={st}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`rounded-lg border p-2 md:p-3 ${getStatusColor(st)}`}
              >
                <div className="font-medium mb-1 text-sm md:text-base flex items-center justify-between">
                  <div className="truncate" title={st}>
                    {st}
                  </div>
                  <div className="text-xs opacity-75 ml-2 flex-shrink-0 tabular-nums">
                    (
                    <AnimatedInteger
                      value={kanbanColumns[st]?.length ?? 0}
                      delayMs={columnIndex * 70}
                      durationMs={750}
                    />
                    )
                  </div>
                </div>
                <div className="max-h-[400px] md:max-h-[600px] lg:max-h-[800px] overflow-y-auto space-y-1 scrollbar-hide">
                  {kanbanColumns[st]?.map((s, index) => {
                    const impactData = s.impact as { score?: number; text?: string } | null
                    const capacityData = s.capacity as { score?: number; text?: string } | null
                    const effortData = s.effort as { score?: number; text?: string } | null

                    const impactScore = impactData?.score ?? 0
                    const capacityScore = capacityData?.score ?? 0
                    const effortScore = effortData?.score ?? 0
                    const pontuacao = Math.max(0, impactScore + capacityScore - effortScore)

                    return (
                      <Draggable draggableId={s.id} index={index} key={s.id}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                            <Card
                              className="bg-background/80 cursor-pointer hover:bg-background/90 transition-colors"
                              onClick={() => onOpenSuggestion(s)}
                            >
                              <CardContent className="p-2 md:p-3">
                                <div className="text-xs md:text-sm font-medium truncate mb-1">
                                  #{formatIdeaNumber(s.ideaNumber)} —{" "}
                                  {(s.problem ?? "Sem problema definido").substring(0, 25)}...
                                </div>
                                <div className="text-xs text-muted-foreground mb-2">
                                  <div className="truncate">
                                    {s.isNameVisible
                                      ? s.submittedName ?? "Não informado"
                                      : "Nome oculto"}
                                  </div>
                                  {s.isNameVisible && s.submittedSector && (
                                    <span className="ml-1 text-[9px] md:text-[10px] bg-muted px-1 py-0.5 rounded inline-block mt-1">
                                      {s.submittedSector}
                                    </span>
                                  )}
                                  <div className="text-[10px] md:text-[11px] opacity-75 mt-1">
                                    {s.createdAt
                                      ? new Date(s.createdAt).toLocaleDateString("pt-BR", {
                                          day: "2-digit",
                                          month: "short",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Data não disponível"}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-1">
                                  <div className="text-xs font-medium flex-shrink-0">
                                    {pontuacao} pts
                                  </div>
                                  {s.payment && (
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-1 py-0 font-medium flex-shrink-0 ${
                                        s.payment.status === "paid"
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-orange-50 text-orange-700 border-orange-200"
                                      }`}
                                    >
                                      {s.payment.status === "paid" ? "✓ Pago" : "⏳ Não Pago"}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}
