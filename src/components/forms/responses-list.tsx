"use client"

import { useState } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusUpdateButton } from "./status-update-button"
import { ResponsesFilters, type ResponsesFiltersState } from "./responses-filters"

export function ResponsesList({ formId }: { formId: string }) {
  const [filters, setFilters] = useState<ResponsesFiltersState>({
    userIds: [],
    setores: [],
  })

  const { data: responses, isLoading } = api.formResponse.listByForm.useQuery({
    formId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    priority: filters.priority,
    userIds: filters.userIds.length > 0 ? filters.userIds : undefined,
    setores: filters.setores.length > 0 ? filters.setores : undefined,
    hasResponse: filters.hasResponse,
  })

  const { data: form } = api.form.getById.useQuery({ id: formId })
  const { data: currentUser } = api.user.me.useQuery()
  const isOwner = form?.userId === currentUser?.id

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!responses || responses.length === 0) {
    return (
      <>
        <ResponsesFilters filters={filters} onFiltersChange={setFilters} />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhuma resposta encontrada</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {isOwner ? "Ainda não há respostas para este formulário." : "Você ainda não respondeu este formulário."}
          </p>
          {!isOwner && (
            <Link href={`/forms/${formId}/respond`}>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Responder Formulário
              </Button>
            </Link>
          )}
        </div>
      </>
    )
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

  return (
    <div className="space-y-6">
      <ResponsesFilters filters={filters} onFiltersChange={setFilters} />
      <div className="grid grid-cols-1 gap-6">
        {responses.map((response) => (
          <Card key={response.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={response.user.imageUrl ?? ""} alt={response.user.firstName ?? "Usuário"} />
                    <AvatarFallback>
                      {response.user.firstName?.charAt(0) ?? response.user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {response.user.firstName
                        ? `${response.user.firstName} ${response.user.lastName ?? ""}`
                        : response.user.email}
                    </CardTitle>
                    <CardDescription>
                      Enviado {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true, locale: ptBR })}
                    </CardDescription>
                  </div>
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
              <div className="text-sm text-muted-foreground">
                {(response.responses as unknown[]).length} respostas enviadas
              </div>
            </CardContent>
            <CardFooter className="flex flex-col md:flex-row gap-y-2 items-end justify-between pt-3 border-t">
              <Link href={`/forms/${formId}/responses/${response.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalhes
                </Button>
              </Link>
              {isOwner && (
                <StatusUpdateButton
                  responseId={response.id}
                  currentStatus={response.status}
                  currentComment={response.statusComment ?? ""}
                />
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

