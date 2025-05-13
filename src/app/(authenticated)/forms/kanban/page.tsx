"use client"

import { useState, useEffect } from "react"
import { api } from "@/trpc/react"
import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd"
import { Loader2 } from "lucide-react"
import type { ResponseStatus } from "@/types/form-responses"
import { KanbanColumn } from "./_components/kanban-column"
import { ResponseDialog } from "./_components/response-dialog"
import type { FormResponse } from "@/types/form-responses"

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
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="mb-6 text-3xl font-bold">Kanban de Solicitações</h1>

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
        </div>
    )
}
