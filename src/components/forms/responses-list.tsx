"use client"

import { useState } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Eye, FileText, Loader2, MessageSquare } from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusUpdateButton } from "./status-update-button"
import { ResponsesFilters, type ResponsesFiltersState } from "./responses-filters"
import type { FormResponse, ChatMessage } from "@/types/form-responses"
import type { Field } from "@/lib/form-types"

export function ResponsesList({ formId }: { formId: string }) {
  const [page, setPage] = useState(1)
  const pageSize = 15

  const [filters, setFilters] = useState<ResponsesFiltersState>({
    userIds: [],
    setores: [],
    tagIds: [],
  })

  // Resetar página quando filtros mudarem
  const onFiltersChange = (newFilters: ResponsesFiltersState) => {
    setFilters(newFilters)
    setPage(1)
  }

  const { data, isLoading } = api.formResponse.listByForm.useQuery({
    formId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    priority: filters.priority,
    userIds: filters.userIds.length > 0 ? filters.userIds : undefined,
    setores: filters.setores.length > 0 ? filters.setores : undefined,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    number: filters.number ? parseInt(filters.number) : undefined,
    hasResponse: filters.hasResponse,
    take: pageSize,
    skip: (page - 1) * pageSize,
  })

  const responses = (data?.items ?? []) as FormResponse[]
  const totalCount = data?.totalCount ?? 0

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
        <ResponsesFilters filters={filters} onFiltersChange={onFiltersChange} />
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
                Abrir nova solicitação
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

  function paginacao() {
    const from = (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, totalCount)

    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {from}-{to} de {totalCount} respostas
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={to >= totalCount}
          >
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  function formatResponseValue(value: unknown): string {
    if (value === null || value === undefined) return "Não informado"
    if (typeof value === "string") return value
    if (typeof value === "number" || typeof value === "boolean") return String(value)
    if (Array.isArray(value)) {
      return value.map((v) => formatResponseValue(v)).join(", ")
    }
    if (typeof value === "object") {
      return JSON.stringify(value)
    }
    return String(value as string | number | boolean | symbol | bigint)
  }

  return (
    <div className="space-y-6">
      {paginacao()}
      <ResponsesFilters filters={filters} onFiltersChange={onFiltersChange} />
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
                      Enviado {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true, locale: ptBR })} <br />
                      {/* Campos personalizados selecionados */}
                      {(form?.fields as Field[] | undefined)?.filter(f => f.showInList).map(field => (
                        <div key={field.id} className="mt-1">
                          {field.label}: <strong>{formatResponseValue(response.responses[0]?.[field.name])}</strong>
                        </div>
                      ))}
                    </CardDescription>
                    <CardContent className="pt-2 px-0">
                      {!!(response.FormResponseChat || response.formResponseChat) ? (
                        (response.FormResponseChat?.length ?? 0) > 0 || (response.formResponseChat?.length ?? 0) > 0 ? (
                          <div className="mt-2 space-y-2">
                            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                              <MessageSquare className="h-3 w-3" />
                              Últimas mensagens
                            </p>
                            <div className="space-y-1.5">
                              {[...(response.FormResponseChat ?? response.formResponseChat ?? [])].reverse().map((chat: ChatMessage) => (
                                <div key={chat.id} className="flex items-start gap-2 bg-muted/30 p-2 rounded-md border border-muted/50">
                                  <Avatar className="h-5 w-5 shrink-0">
                                    <AvatarImage src={chat.user.imageUrl ?? ""} />
                                    <AvatarFallback className="text-[8px]">
                                      {chat.user.firstName?.[0] ?? chat.user.email[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center gap-2">
                                      <p className="text-[10px] font-bold truncate">
                                        {chat.user.firstName ?? chat.user.email}
                                      </p>
                                      <span className="text-[9px] text-muted-foreground shrink-0 font-medium">
                                        {format(new Date(chat.createdAt), "HH:mm", { locale: ptBR })}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-1 italic leading-tight">
                                      &quot;{chat.message}&quot;
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic mt-2">Nenhuma mensagem no chat ainda.</p>
                        )
                      ) : (
                        <div className="flex items-center gap-2 mt-2">
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground italic">Carregando mensagens...</p>
                        </div>
                      )}
                    </CardContent>
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
            < CardFooter className="flex flex-col md:flex-row gap-y-2 items-end justify-between pt-3 border-t" >
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
        ))
        }
      </div >
    </div >
  )
}

