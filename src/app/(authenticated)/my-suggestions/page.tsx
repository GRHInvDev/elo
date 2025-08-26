"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Search, Filter, Lightbulb, CheckCircle, Clock, AlertTriangle, XCircle, TrendingUp, Eye, EyeOff } from "lucide-react"
import { api } from "@/trpc/react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

const STATUS_MAPPING = {
  "NEW": "Novo",
  "IN_REVIEW": "Em avaliação",
  "APPROVED": "Aprovado",
  "IN_PROGRESS": "Em execução",
  "DONE": "Concluído",
  "NOT_IMPLEMENTED": "Não implementado"
} as const

// Tipos para as sugestões
interface SuggestionContribution {
  type: string
  other?: string
}

// Função helper para acessar propriedades de forma segura com tipagem
const getSuggestionProperty = function<T>(suggestion: unknown, property: string, defaultValue: T): T {
  if (suggestion && typeof suggestion === 'object' && property in suggestion) {
    const value = (suggestion as Record<string, unknown>)[property]
    return value !== undefined ? (value as T) : defaultValue
  }
  return defaultValue
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "NEW":
      return {
        icon: Clock,
        color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        description: "Sua sugestão foi recebida e aguarda avaliação"
      }
    case "IN_REVIEW":
      return {
        icon: Eye,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
        description: "Sua sugestão está sendo analisada por nossa equipe"
      }
    case "APPROVED":
      return {
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        description: "Sua sugestão foi aprovada e será implementada em breve"
      }
    case "IN_PROGRESS":
      return {
        icon: TrendingUp,
        color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        description: "Sua sugestão está sendo implementada"
      }
    case "DONE":
      return {
        icon: CheckCircle,
        color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
        description: "Sua sugestão foi implementada com sucesso"
      }
    case "NOT_IMPLEMENTED":
    default:
      return {
        icon: XCircle,
        color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
        description: "Sua sugestão não será implementada neste momento"
      }
  }
}

export default function MySuggestionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Buscar sugestões do usuário logado
  const { data: userSuggestions = [], isLoading } = api.suggestion.getMySuggestions.useQuery()

  // Filtrar sugestões baseado nos critérios
  const filteredSuggestions = useMemo(() => {
    return userSuggestions.filter((suggestion: unknown) => {
      const description = getSuggestionProperty<string>(suggestion, 'description', '')
      const problem = getSuggestionProperty<string>(suggestion, 'problem', '')
      const ideaNumber = getSuggestionProperty<number>(suggestion, 'ideaNumber', 0)
      const status = getSuggestionProperty<string>(suggestion, 'status', '')

      const matchesSearch = searchTerm === "" ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(ideaNumber).includes(searchTerm)

      const matchesStatus = statusFilter === "all" || status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [userSuggestions, searchTerm, statusFilter])

  // Estatísticas
  const stats = useMemo(() => {
    const total = userSuggestions.length
    const approved = userSuggestions.filter((s: unknown) => {
      const status = getSuggestionProperty<string>(s, 'status', '')
      return status === "APPROVED" || status === "IN_PROGRESS" || status === "DONE"
    }).length
    const inReview = userSuggestions.filter((s: unknown) => {
      const status = getSuggestionProperty<string>(s, 'status', '')
      return status === "IN_REVIEW"
    }).length
    const completed = userSuggestions.filter((s: unknown) => {
      const status = getSuggestionProperty<string>(s, 'status', '')
      return status === "DONE"
    }).length

    return { total, approved, inReview, completed }
  }, [userSuggestions])

  const getContributionTypeLabel = (type: string, other?: string) => {
    switch (type) {
      case "IDEIA_INOVADORA":
        return "Ideia inovadora"
      case "SUGESTAO_MELHORIA":
        return "Sugestão de melhoria"
      case "SOLUCAO_PROBLEMA":
        return "Solução de problema"
      case "OUTRO":
        return `Outro: ${other ?? ""}`
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
          <Lightbulb className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground">
            Minhas Sugestões
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Acompanhe o status das suas sugestões enviadas
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.inReview}</p>
                <p className="text-sm text-muted-foreground">Em avaliação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, problema ou solução..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por status */}
            <div className="w-full lg:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(STATUS_MAPPING).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de sugestões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Minhas Sugestões ({filteredSuggestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSuggestions.length === 0 ? (
            <div className="p-12 text-center">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm || statusFilter !== "all"
                  ? "Nenhuma sugestão encontrada"
                  : "Você ainda não enviou sugestões"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Que tal enviar sua primeira sugestão?"}
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredSuggestions.map((suggestion: unknown) => {
                const id = getSuggestionProperty<string>(suggestion, 'id', '')
                const ideaNumber = getSuggestionProperty<number>(suggestion, 'ideaNumber', 0)
                const status = getSuggestionProperty<string>(suggestion, 'status', 'NEW')
                const problem = getSuggestionProperty<string>(suggestion, 'problem', 'Sem problema definido')
                const createdAt = getSuggestionProperty<Date>(suggestion, 'createdAt', new Date())

                const statusConfig = getStatusConfig(status)
                const StatusIcon = statusConfig.icon

                return (
                  <AccordionItem key={id} value={id} className="border-b border-border">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4 text-left">
                          <div className="flex-shrink-0">
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground dark:text-foreground">
                                #{ideaNumber}
                              </span>
                              <Badge className={statusConfig.color}>
                                {STATUS_MAPPING[status as keyof typeof STATUS_MAPPING] || status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate">
                              {problem}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {formatDistanceToNow(createdAt, {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-6 pb-4">
                      <div className="space-y-4">
                        {/* Status com descrição */}
                        <div className="p-4 rounded-lg bg-muted/30 dark:bg-muted/30 border">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className="font-medium text-foreground dark:text-foreground">
                              Status: {STATUS_MAPPING[status as keyof typeof STATUS_MAPPING] || status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            {statusConfig.description}
                          </p>
                        </div>
                        {/* Detalhes da sugestão */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium">Problema identificado</Label>
                              <div className="mt-1 p-3 bg-muted/50 dark:bg-muted/50 rounded border text-sm">
                                {problem || "Não informado"}
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Solução proposta</Label>
                              <div className="mt-1 p-3 bg-muted/50 dark:bg-muted/50 rounded border text-sm whitespace-pre-wrap">
                                {getSuggestionProperty<string>(suggestion, 'description', 'Não informado')}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium">Tipo de contribuição</Label>
                              <div className="mt-1">
                                <Badge variant="outline">
                                  {getContributionTypeLabel(
                                    getSuggestionProperty<string>(getSuggestionProperty<SuggestionContribution | undefined>(suggestion, 'contribution', undefined), 'type', ''),
                                    getSuggestionProperty<string>(getSuggestionProperty<SuggestionContribution | undefined>(suggestion, 'contribution', undefined), 'other', '')
                                  )}
                                </Badge>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Informações adicionais</Label>
                              <div className="mt-1 space-y-2 text-sm text-muted-foreground dark:text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Enviado em:</span>
                                  <span>
                                    {createdAt.toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Visibilidade:</span>
                                  <span className="flex items-center gap-1">
                                    {getSuggestionProperty<boolean>(suggestion, 'isNameVisible', false) ? (
                                      <>
                                        <Eye className="h-3 w-3" />
                                        Nome visível
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="h-3 w-3" />
                                        Nome oculto
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Motivo de rejeição (se houver) */}
                        {status === "NOT_IMPLEMENTED" && getSuggestionProperty<string>(suggestion, 'rejectionReason', '') && (
                          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <Label className="text-sm font-medium text-red-800 dark:text-red-400">
                                  Motivo da não implementação
                                </Label>
                                <p className="mt-1 text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                                  {getSuggestionProperty<string>(suggestion, 'rejectionReason', '')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}