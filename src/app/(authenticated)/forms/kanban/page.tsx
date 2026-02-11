"use client"

import { useState, useEffect } from "react"
import { api } from "@/trpc/react"
import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd"
import type { ResponseStatus } from "@/types/form-responses"
import { KanbanColumn } from "./_components/kanban-column"
import { KanbanSkeleton } from "@/components/forms/responses-skeleton"
import { ResponseDialog } from "./_components/response-dialog"
import { KanbanFilters, type KanbanFiltersState } from "./_components/kanban-filters"
import { TagsManagerModal } from "./_components/tags-manager-modal"
import type { FormResponse } from "@/types/form-responses"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Tags } from "lucide-react"
import { EditResponseModal } from "@/components/forms/edit-response-modal"

export default function KanbanPage() {
    const [selectedResponse, setSelectedResponse] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isTagsModalOpen, setIsTagsModalOpen] = useState(false)
    const [editResponseId, setEditResponseId] = useState<string | null>(null)
    const [editFormId, setEditFormId] = useState<string | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [localResponses, setLocalResponses] = useState<FormResponse[]>([])
    const [filters, setFilters] = useState<KanbanFiltersState>({
        userIds: [],
        setores: [],
        tagIds: [],
        formIds: [],
    })

    // Fetch form responses with filters
    const { data: responses, isLoading, refetch } = api.formResponse.listKanBan.useQuery({
        startDate: filters.startDate,
        endDate: filters.endDate,
        priority: filters.priority,
        userIds: filters.userIds.length > 0 ? filters.userIds : undefined,
        setores: filters.setores.length > 0 ? filters.setores : undefined,
        tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
        formIds: filters.formIds.length > 0 ? filters.formIds : undefined,
        number: filters.number ? parseInt(filters.number) : undefined,
        hasResponse: filters.hasResponse,
    })

    // Update local state when server data changes
    useEffect(() => {
        if (responses) {
            // O router já converte tags, mas precisamos garantir o tipo
            setLocalResponses(responses as FormResponse[])
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

    const handleEdit = (responseId: string, formId: string) => {
        setEditResponseId(responseId)
        setEditFormId(formId)
        setIsEditModalOpen(true)
    }

    const handleOpenChat = (responseId: string) => {
        setSelectedResponse(responseId)
        setIsDialogOpen(true)
        // O ResponseDialog já tem o chat integrado, então apenas abrimos o dialog
    }

    const handleMoveToNextStatus = (responseId: string, currentStatus: ResponseStatus) => {
        const statusOrder: ResponseStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]
        const currentIndex = statusOrder.indexOf(currentStatus)
        if (currentIndex < statusOrder.length - 1) {
            const nextStatus = statusOrder[currentIndex + 1]!
            updateStatusMutation.mutate({
                responseId,
                status: nextStatus,
            })
        }
    }

    if (isLoading) {
        return (
            <DashboardShell>
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Kanban de Solicitações</h1>
                            <p className="text-muted-foreground mt-2">
                                Visualize e organize as respostas recebidas nos seus formulários.
                            </p>
                        </div>
                        <Button variant="outline" disabled>
                            <Tags className="h-4 w-4 mr-2" />
                            Gerenciar Tags
                        </Button>
                    </div>
                </div>

                <KanbanFilters filters={filters} onFiltersChange={setFilters} />

                <KanbanSkeleton />
            </DashboardShell>
        )
    }

    if (!responses || (responses.length === 0 && !isLoading)) {
        return (
            <DashboardShell>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Kanban de Solicitações</h1>
                    <p className="text-muted-foreground mt-2">
                        Visualize e organize as respostas recebidas nos seus formulários.
                    </p>
                </div>

                <KanbanFilters filters={filters} onFiltersChange={setFilters} />

                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                        {filters.number || filters.tagIds.length > 0 || filters.userIds.length > 0 || filters.setores.length > 0 || filters.formIds.length > 0 || filters.startDate
                            ? "Nenhuma solicitação corresponde aos filtros aplicados."
                            : "Você ainda não recebeu nenhuma resposta em seus formulários."}
                    </p>
                </div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell>
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Kanban de Solicitações</h1>
                        <p className="text-muted-foreground mt-2">
                            Visualize e organize as respostas recebidas nos seus formulários.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setIsTagsModalOpen(true)}
                    >
                        <Tags className="h-4 w-4 mr-2" />
                        Gerenciar Tags
                    </Button>
                </div>
            </div>

            <KanbanFilters filters={filters} onFiltersChange={setFilters} />

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <KanbanColumn
                        title="Não Iniciado"
                        status="NOT_STARTED"
                        responses={columns.NOT_STARTED}
                        onOpenDetails={handleOpenDetails}
                        onEdit={handleEdit}
                        onOpenChat={handleOpenChat}
                        onMoveToNextStatus={handleMoveToNextStatus}
                        onOpenTagsManager={() => setIsTagsModalOpen(true)}
                    />

                    <KanbanColumn
                        title="Em Progresso"
                        status="IN_PROGRESS"
                        responses={columns.IN_PROGRESS}
                        onOpenDetails={handleOpenDetails}
                        onEdit={handleEdit}
                        onOpenChat={handleOpenChat}
                        onMoveToNextStatus={handleMoveToNextStatus}
                        onOpenTagsManager={() => setIsTagsModalOpen(true)}
                    />

                    <KanbanColumn
                        title="Concluído"
                        status="COMPLETED"
                        responses={columns.COMPLETED}
                        onOpenDetails={handleOpenDetails}
                        onEdit={handleEdit}
                        onOpenChat={handleOpenChat}
                        onMoveToNextStatus={handleMoveToNextStatus}
                        onOpenTagsManager={() => setIsTagsModalOpen(true)}
                    />
                </div>
            </DragDropContext>

            {selectedResponse && (
                <ResponseDialog responseId={selectedResponse} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            )}

            <TagsManagerModal
                open={isTagsModalOpen}
                onOpenChange={setIsTagsModalOpen}
            />

            {editResponseId && editFormId && (
                <EditResponseModal
                    responseId={editResponseId}
                    formId={editFormId}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false)
                        setEditResponseId(null)
                        setEditFormId(null)
                    }}
                />
            )}
        </DashboardShell>
    )
}
