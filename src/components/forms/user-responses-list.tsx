"use client"

import { useState } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Loader2, Filter } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ResponseDialog } from "@/app/(authenticated)/forms/kanban/_components/response-dialog"
import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd"
import { KanbanColumn } from "@/app/(authenticated)/forms/kanban/_components/kanban-column"
import type { ResponseStatus, FormResponse } from "@/types/form-responses"
import React from "react"

export function UserResponsesList() {
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set())
  const [localResponses, setLocalResponses] = useState<FormResponse[]>([])
  const [selectedKanbanResponse, setSelectedKanbanResponse] = useState<string | null>(null)
  const [isKanbanDialogOpen, setIsKanbanDialogOpen] = useState(false)

  // Fetch responses for both views
  const { data: responses, isLoading } = api.formResponse.listUserResponses.useQuery()
  // Para o kanban, usamos a mesma query das respostas do usuário
  const { data: kanbanResponses, isLoading: isKanbanLoading, refetch } = api.formResponse.listUserResponses.useQuery()

  // Update local state when server data changes
  React.useEffect(() => {
    if (kanbanResponses) {
      setLocalResponses(kanbanResponses as FormResponse[])
    }
  }, [kanbanResponses])

  const updateStatusMutation = api.formResponse.updateStatus.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  const handleOpenDetails = (responseId: string) => {
    setSelectedResponseId(responseId)
    setIsDialogOpen(true)
  }

  const handleKanbanOpenDetails = (responseId: string) => {
    setSelectedKanbanResponse(responseId)
    setIsKanbanDialogOpen(true)
  }

  const toggleStatusFilter = (status: string) => {
    const newStatuses = new Set(selectedStatuses)
    if (newStatuses.has(status)) {
      newStatuses.delete(status)
    } else {
      newStatuses.add(status)
    }
    setSelectedStatuses(newStatuses)
  }

  const clearFilters = () => {
    setSelectedStatuses(new Set())
  }

  // Filter responses based on selected statuses
  const filteredResponses = responses?.filter(response => 
    selectedStatuses.size === 0 || selectedStatuses.has(response.status)
  ) ?? []

  // Group responses by status for Kanban
  const columns = {
    NOT_STARTED: localResponses.filter((response) => response.status === "NOT_STARTED"),
    IN_PROGRESS: localResponses.filter((response) => response.status === "IN_PROGRESS"),
    COMPLETED: localResponses.filter((response) => response.status === "COMPLETED"),
  }

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

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

    updateStatusMutation.mutate({
      responseId: draggableId,
      status: destination.droppableId as ResponseStatus,
    })
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "NOT_STARTED":
        return (
          <Badge variant="outline" className="bg-muted">
            Não iniciado
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Em andamento
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Concluído
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  if (isLoading || isKanbanLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!responses || responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhuma resposta encontrada</h3>
        <p className="text-muted-foreground mt-1 mb-4">Você ainda não respondeu nenhum formulário.</p>
        <Link href="/forms">
          <Button>Ver Formulários Disponíveis</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full md:w-1/4 grid-cols-2">
          <TabsTrigger value="list">Lista com Filtros</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filtros Colapsáveis */}
          <Accordion type="single" collapsible className="w-full md:w-1/4">
            <AccordionItem value="filters">
              <AccordionTrigger className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros por Status
                {selectedStatuses.size > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedStatuses.size} selecionado{selectedStatuses.size > 1 ? 's' : ''}
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "NOT_STARTED", label: "Não iniciado", color: "bg-muted" },
                      { value: "IN_PROGRESS", label: "Em andamento", color: "bg-blue-100 text-blue-800 border-blue-300" },
                      { value: "COMPLETED", label: "Concluído", color: "bg-green-100 text-green-800 border-green-300" }
                    ].map((status) => (
                      <Button
                        key={status.value}
                        variant={selectedStatuses.has(status.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleStatusFilter(status.value)}
                        className="flex items-center gap-2 w-full md:w-1/4"
                      >
                        <div className={`w-3 h-3 rounded-full ${selectedStatuses.has(status.value) ? 'bg-white' : status.color}`} />
                        {status.label}
                      </Button>
                    ))}
                  </div>
                  {selectedStatuses.size > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Lista Filtrada */}
          <div className="grid grid-cols-1 gap-6">
            {filteredResponses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma resposta encontrada</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  Tente ajustar os filtros para ver mais resultados.
                </p>
                {selectedStatuses.size > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                )}
              </div>
            ) : (
              filteredResponses.map((response) => (
                <Card key={response.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{response.form.title}</CardTitle>
                        <CardDescription>
                          Enviado {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true, locale: ptBR })}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(response.status)}
                        {response.statusComment && (
                          <p className="text-sm text-muted-foreground max-w-[200px] text-right">{response.statusComment}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {response.form.description ? (
                      <div className="text-sm text-muted-foreground whitespace-pre-line">
                        {response.form.description.replace(/\\n/g, "\n")}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Sem descrição</div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col md:flex-row gap-y-2 justify-between pt-3 border-t">
                    <Link className="w-full md:w-auto" href={`/forms/${response.formId}`}>
                      <Button variant="outline" size="sm" className="w-full md:w-auto">
                        <FileText className="h-4 w-4 mr-1" />
                        Ver Formulário
                      </Button>
                    </Link>
                    <Button size="sm" className="w-full md:w-auto" onClick={() => handleOpenDetails(response.id)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="kanban" className="space-y-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <KanbanColumn
                title="Não Iniciado"
                status="NOT_STARTED"
                responses={columns.NOT_STARTED}
                onOpenDetails={handleKanbanOpenDetails}
              />
              <KanbanColumn
                title="Em Progresso"
                status="IN_PROGRESS"
                responses={columns.IN_PROGRESS}
                onOpenDetails={handleKanbanOpenDetails}
              />
              <KanbanColumn
                title="Concluído"
                status="COMPLETED"
                responses={columns.COMPLETED}
                onOpenDetails={handleKanbanOpenDetails}
              />
            </div>
          </DragDropContext>
        </TabsContent>
      </Tabs>

      {selectedResponseId && (
        <ResponseDialog responseId={selectedResponseId} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      )}

      {selectedKanbanResponse && (
        <ResponseDialog responseId={selectedKanbanResponse} open={isKanbanDialogOpen} onOpenChange={setIsKanbanDialogOpen} />
      )}
    </div>
  )
}