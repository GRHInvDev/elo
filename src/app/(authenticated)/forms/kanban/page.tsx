"use client"

import { useState, useEffect } from "react"
import { api } from "@/trpc/react"
import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd"
import { Loader2 } from "lucide-react"
import type { ResponseStatus } from "@/types/form-responses"
import { KanbanColumn } from "./_components/kanban-column"
import { ResponseDialog } from "./_components/response-dialog"
import type { FormResponse } from "@/types/form-responses"
import { DashboardShell } from "@/components/dashboard-shell"

export default function KanbanPage() {
    const [selectedResponse, setSelectedResponse] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [localResponses, setLocalResponses] = useState<FormResponse[]>([])

    // Fetch form responses
    const { data: responses, isLoading, refetch } = api.formResponse.listKanBan.useQuery()

    // Update local state when server data changes
    useEffect(() => {
        if (responses) {
            setLocalResponses(responses)
        }
    }, [responses])

    // Update status mutation
    const updateStatusMutation = api.formResponse.updateStatus.useMutation({
        onSuccess: () => {
            void refetch()
        },
    })

    // Group responses by status
    const columns = {
        NOT_STARTED: localResponses.filter((response) => response.status === "NOT_STARTED"),
        IN_PROGRESS: localResponses.filter((response) => response.status === "IN_PROGRESS"),
        COMPLETED: localResponses.filter((response) => response.status === "COMPLETED"),
    }

    // Handle drag end
    const onDragEnd: OnDragEndResponder = (result) => {
        const { destination, source, draggableId } = result

        // If dropped outside a droppable area
        if (!destination) return

        // If dropped in the same place
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return
        }

        // Update local state immediately for instant UI feedback
        setLocalResponses((prev) =>
            prev.map((res) => {
                if (res.id === draggableId) {
                    return {
                        ...res,
                        status: destination.droppableId as ResponseStatus,
                    }
                }
                return res
            }),
        )

        // Update the status in the database
        updateStatusMutation.mutate({
            responseId: draggableId,
            status: destination.droppableId as ResponseStatus,
        })
    }

    const handleOpenDetails = (responseId: string) => {
        setSelectedResponse(responseId)
        setIsDialogOpen(true)
    }

    if (isLoading) {
        return (
            <DashboardShell>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardShell>
        )
    }

    if (!responses || responses.length === 0) {
        return (
            <DashboardShell>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Kanban de Solicitações</h1>
                    <p className="text-muted-foreground mt-2">
                        Visualize e organize as respostas recebidas nos seus formulários.
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                        Você ainda não recebeu nenhuma resposta em seus formulários.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        As respostas aparecerão aqui quando alguém responder aos seus formulários.
                    </p>
                </div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Kanban de Solicitações</h1>
                <p className="text-muted-foreground mt-2">
                    Visualize e organize as respostas recebidas nos seus formulários.
                </p>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <KanbanColumn
                        title="Não Iniciado"
                        status="NOT_STARTED"
                        responses={columns.NOT_STARTED}
                        onOpenDetails={handleOpenDetails}
                    />

                    <KanbanColumn
                        title="Em Progresso"
                        status="IN_PROGRESS"
                        responses={columns.IN_PROGRESS}
                        onOpenDetails={handleOpenDetails}
                    />

                    <KanbanColumn
                        title="Concluído"
                        status="COMPLETED"
                        responses={columns.COMPLETED}
                        onOpenDetails={handleOpenDetails}
                    />
                </div>
            </DragDropContext>

            {selectedResponse && (
                <ResponseDialog responseId={selectedResponse} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            )}
        </DashboardShell>
    )
}
