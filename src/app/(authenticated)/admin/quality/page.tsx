"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Edit, Trash2, ExternalLink, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useAccessControl } from "@/hooks/use-access-control"
import { QualityDocumentForm } from "@/components/admin/quality/quality-document-form"
import type { Enterprise } from "@prisma/client"
import type { QualityDocumentListItem } from "@/types/quality-document"
type DocRevPeriod = "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL"

export default function QualityManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchColumn, setSearchColumn] = useState<"docName" | "docDesc" | "docProcess" | "docCod" | "docTypeArc" | "docAvailability" | undefined>(undefined)
  const [selectedDocument, setSelectedDocument] = useState<QualityDocumentListItem | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  // Filtros
  const [enterpriseFilter, setEnterpriseFilter] = useState<Enterprise | "all">("all")
  const [setorFilter, setSetorFilter] = useState<string>("all")
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all")
  const [lastEditFrom, setLastEditFrom] = useState<string>("")
  const [lastEditTo, setLastEditTo] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  // Verificar permissões
  const { canManageQualityManagement } = useAccessControl()
  const canManage = canManageQualityManagement()

  // Buscar usuários para filtros e seleção
  const { data: users } = api.user.searchMinimal.useQuery({ query: "" }, { enabled: canManage })

  // Buscar documentos
  const { data: documentsData, isLoading, refetch } = api.qualityDocument.list.useQuery({
    limit: 1000,
    enterprise: enterpriseFilter !== "all" ? enterpriseFilter : undefined,
    setor: setorFilter !== "all" ? setorFilter : undefined,
    docResponsibleId: responsibleFilter !== "all" ? responsibleFilter : undefined,
    docLastEditFrom: lastEditFrom ? new Date(lastEditFrom) : undefined,
    docLastEditTo: lastEditTo ? new Date(lastEditTo) : undefined,
    search: searchTerm || undefined,
    searchColumn: searchColumn,
  })

  const documents: QualityDocumentListItem[] = documentsData?.items ?? []

  // Mutations
  const deleteDocument = api.qualityDocument.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento excluído com sucesso!")
      void refetch()
    },
    onError: (error) => {
      toast.error("Erro ao excluir documento: " + error.message)
    },
  })

  const handleDelete = async (documentId: string) => {
    try {
      await deleteDocument.mutateAsync({ id: documentId })
    } catch (error) {
      // Error handled in mutation
      void error
    }
  }

  // Obter setores únicos dos documentos
  const uniqueSetors = useMemo(() => {
    const setors = new Set<string>()
    for (const doc of documents) {
      if (doc.docResponsible?.setor) setors.add(doc.docResponsible.setor)
      if (doc.docApprovedManager?.setor) setors.add(doc.docApprovedManager.setor)
    }
    return Array.from(setors).sort()
  }, [documents])

  // Obter responsáveis únicos
  const uniqueResponsibles = useMemo(() => {
    const responsibles = new Map<string, { id: string; name: string }>()
    for (const doc of documents) {
      if (doc.docResponsible) {
        const name = `${doc.docResponsible.firstName || ""} ${doc.docResponsible.lastName || ""}`.trim() || doc.docResponsible.email
        responsibles.set(doc.docResponsible.id, { id: doc.docResponsible.id, name })
      }
    }
    return Array.from(responsibles.values())
  }, [documents])

  const formatUserName = (user: { firstName: string | null; lastName: string | null; email: string } | null) => {
    if (!user) return "-"
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim()
    return name || user.email
  }

  const formatEnterprise = (enterprise: Enterprise | null) => {
    if (!enterprise) return "-"
    return enterprise === "NA" ? "N/A" : enterprise
  }

  const formatRevPeriod = (period: string) => {
    const periods: Record<string, string> = {
      MENSAL: "Mensal",
      TRIMESTRAL: "Trimestral",
      SEMESTRAL: "Semestral",
      ANUAL: "Anual",
    }
    return periods[period] || period
  }

  const getEnterpriseFromDocument = (doc: QualityDocumentListItem): Enterprise => {
    return doc.docResponsible?.enterprise || doc.docApprovedManager?.enterprise || "NA"
  }

  const getSetorFromDocument = (doc: QualityDocumentListItem): string => {
    return doc.docResponsible?.setor || doc.docApprovedManager?.setor || "-"
  }

  if (!canManage) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão para acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Qualidade</h1>
          <p className="text-muted-foreground">
            Lista Mestra de Documentos - Grupo RHenz
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Documento</DialogTitle>
            </DialogHeader>
            <QualityDocumentForm
              onSuccess={() => {
                setIsCreateDialogOpen(false)
                void refetch()
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Mestra de Documentos</CardTitle>
          <CardDescription>
            {documents.length} documento{documents.length !== 1 ? "s" : ""} encontrado{documents.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barra de busca e filtros */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={searchColumn || "all"} onValueChange={(value) => setSearchColumn(value === "all" ? undefined : value as any)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Buscar em..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as colunas</SelectItem>
                  <SelectItem value="docName">Nome</SelectItem>
                  <SelectItem value="docDesc">Descrição</SelectItem>
                  <SelectItem value="docProcess">Processo</SelectItem>
                  <SelectItem value="docCod">Código</SelectItem>
                  <SelectItem value="docTypeArc">Tipo de arquivo</SelectItem>
                  <SelectItem value="docAvailability">Disponibilidade</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>

            {/* Painel de filtros */}
            {showFilters && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Filtros</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEnterpriseFilter("all")
                      setSetorFilter("all")
                      setResponsibleFilter("all")
                      setLastEditFrom("")
                      setLastEditTo("")
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Empresa</Label>
                    <Select value={enterpriseFilter} onValueChange={(value) => setEnterpriseFilter(value as Enterprise | "all")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="Box">Box</SelectItem>
                        <SelectItem value="RHenz">RHenz</SelectItem>
                        <SelectItem value="Cristallux">Cristallux</SelectItem>
                        <SelectItem value="Box_Filial">Box Filial</SelectItem>
                        <SelectItem value="Cristallux_Filial">Cristallux Filial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Departamento</Label>
                    <Select value={setorFilter} onValueChange={setSetorFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {uniqueSetors.map((setor) => (
                          <SelectItem key={setor} value={setor}>
                            {setor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Responsável</Label>
                    <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {uniqueResponsibles.map((responsible) => (
                          <SelectItem key={responsible.id} value={responsible.id}>
                            {responsible.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data última revisão (de)</Label>
                    <Input
                      type="date"
                      value={lastEditFrom}
                      onChange={(e) => setLastEditFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data última revisão (até)</Label>
                    <Input
                      type="date"
                      value={lastEditTo}
                      onChange={(e) => setLastEditTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Processo</TableHead>
                  <TableHead>COD</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data última revisão</TableHead>
                  <TableHead>Tipo arquivo</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Aprovador</TableHead>
                  <TableHead>Periodicidade</TableHead>
                  <TableHead>Disponibilidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                      Nenhum documento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc: QualityDocumentListItem) => (
                    <TableRow key={doc.id}>
                      <TableCell>{formatEnterprise(getEnterpriseFromDocument(doc))}</TableCell>
                      <TableCell>{getSetorFromDocument(doc)}</TableCell>
                      <TableCell>{doc.docProcess}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.docCod}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={doc.docDesc}>
                        {doc.docDesc}
                      </TableCell>
                      <TableCell>
                        {format(new Date(doc.docLastEdit), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{doc.docTypeArc}</TableCell>
                      <TableCell>{formatUserName(doc.docResponsible)}</TableCell>
                      <TableCell>{formatUserName(doc.docApprovedManager)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{formatRevPeriod(doc.docRevPeriod)}</Badge>
                      </TableCell>
                      <TableCell>{doc.docAvailability}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(doc.docURL || doc.docLink) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const url = doc.docURL || doc.docLink
                                if (url) window.open(url, "_blank")
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Dialog
                            open={isEditDialogOpen && selectedDocument?.id === doc.id}
                            onOpenChange={(open) => {
                              if (open) {
                                setSelectedDocument(doc)
                                setIsEditDialogOpen(true)
                              } else {
                                setIsEditDialogOpen(false)
                                setSelectedDocument(null)
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Editar Documento</DialogTitle>
                              </DialogHeader>
                              <QualityDocumentForm
                                documentId={doc.id}
                                onSuccess={() => {
                                  setIsEditDialogOpen(false)
                                  setSelectedDocument(null)
                                  void refetch()
                                }}
                                onCancel={() => {
                                  setIsEditDialogOpen(false)
                                  setSelectedDocument(null)
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o documento "{doc.docName}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(doc.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

