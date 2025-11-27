"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Eye, Filter, X, FileText, Calendar, Building, User } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import type { Enterprise } from "@prisma/client"
import type { QualityDocumentListItem } from "@/types/quality-document"

export default function QualityPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchColumn, setSearchColumn] = useState<"all" | "docName" | "docDesc" | "docProcess" | "docCod" | "docTypeArc" | "docAvailability">("all")
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [detailsDocument, setDetailsDocument] = useState<QualityDocumentListItem | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Filtros
  const [enterpriseFilter, setEnterpriseFilter] = useState<Enterprise | "all">("all")
  const [setorFilter, setSetorFilter] = useState<string>("all")
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all")
  const [lastEditFrom, setLastEditFrom] = useState<string>("")
  const [lastEditTo, setLastEditTo] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  // Detectar se estamos em mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Buscar documentos
  const { data: documentsData, isLoading } = api.qualityDocument.list.useQuery({
    limit: 100,
    enterprise: enterpriseFilter !== "all" ? enterpriseFilter : undefined,
    setor: setorFilter !== "all" ? setorFilter : undefined,
    docResponsibleId: responsibleFilter !== "all" ? responsibleFilter : undefined,
    docLastEditFrom: lastEditFrom ? new Date(lastEditFrom) : undefined,
    docLastEditTo: lastEditTo ? new Date(lastEditTo) : undefined,
  })

  // Calcular opções de filtros baseado nos documentos
  const filterOptions = useMemo(() => {
    if (!documentsData?.items) return { setores: [], responsaveis: [] }

    const setoresSet = new Set<string>()
    const responsaveisMap = new Map<string, { id: string; firstName: string | null; lastName: string | null }>()

    for (const doc of documentsData.items) {
      if (doc.docResponsible?.setor) setoresSet.add(doc.docResponsible.setor)
      if (doc.docApprovedManager?.setor) setoresSet.add(doc.docApprovedManager.setor)

      if (doc.docResponsible) {
        responsaveisMap.set(doc.docResponsible.id, {
          id: doc.docResponsible.id,
          firstName: doc.docResponsible.firstName,
          lastName: doc.docResponsible.lastName
        })
      }
    }

    return {
      setores: Array.from(setoresSet).sort(),
      responsaveis: Array.from(responsaveisMap.values())
    }
  }, [documentsData?.items])

  // Filtrar documentos baseado na busca
  const filteredDocuments = useMemo(() => {
    if (!documentsData?.items) return []

    let filtered = documentsData.items

    if (searchTerm && searchColumn) {
      filtered = filtered.filter((doc: QualityDocumentListItem) => {
        if (searchColumn === "all") {
          // Search across all searchable fields
          const searchableFields: (keyof QualityDocumentListItem)[] = ["docName", "docDesc", "docProcess", "docCod", "docTypeArc", "docAvailability"]
          return searchableFields.some(field => {
            const value = doc[field]
            return value && typeof value === 'string' ? value.toLowerCase().includes(searchTerm.toLowerCase()) : false
          })
        } else {
          const value = doc[searchColumn]
          return value?.toLowerCase().includes(searchTerm.toLowerCase())
        }
      })
    }

    return filtered
  }, [documentsData?.items, searchTerm, searchColumn])

  const openDetailsDialog = (document: QualityDocumentListItem) => {
    setDetailsDocument(document)
    setIsDetailsDialogOpen(true)
  }

  const clearFilters = () => {
    setEnterpriseFilter("all")
    setSetorFilter("all")
    setResponsibleFilter("all")
    setLastEditFrom("")
    setLastEditTo("")
  }

  const hasActiveFilters = enterpriseFilter !== "all" ||
                          setorFilter !== "all" ||
                          responsibleFilter !== "all" ||
                          lastEditFrom ||
                          lastEditTo

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Lista Mestre de Documentos de Qualidade</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Visualize todos os documentos de qualidade organizados por empresa e setor
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                    <div className="flex-1 min-w-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                            placeholder="Buscar documentos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                            />
                        </div>
                    </div>
                    <Select value={searchColumn} onValueChange={(value) => setSearchColumn(value as typeof searchColumn)}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Buscar por..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os campos</SelectItem>
                            <SelectItem value="docName">Nome do Documento</SelectItem>
                            <SelectItem value="docDesc">Descrição</SelectItem>
                            <SelectItem value="docProcess">Processo</SelectItem>
                            <SelectItem value="docCod">Código</SelectItem>
                            <SelectItem value="docTypeArc">Tipo</SelectItem>
                            <SelectItem value="docAvailability">Disponibilidade</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  !
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="enterprise" className="text-sm font-medium">Empresa</Label>
                  <Select value={enterpriseFilter} onValueChange={(value) => setEnterpriseFilter(value as Enterprise | "all")}>
                    <SelectTrigger id="enterprise" className="w-full">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="BOX">BOX</SelectItem>
                      <SelectItem value="RHENZ">RHenz</SelectItem>
                      <SelectItem value="CRISTALLUX">Cristallux</SelectItem>
                      <SelectItem value="NA">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setor" className="text-sm font-medium">Setor</Label>
                  <Select value={setorFilter} onValueChange={setSetorFilter}>
                    <SelectTrigger id="setor" className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {filterOptions?.setores?.map(setor => (
                        <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsible" className="text-sm font-medium">Responsável</Label>
                  <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                    <SelectTrigger id="responsible" className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {filterOptions?.responsaveis?.map(resp => (
                        <SelectItem key={resp.id} value={resp.id}>
                          {resp.firstName} {resp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastEditFrom" className="text-sm font-medium">Última edição de</Label>
                  <Input
                    id="lastEditFrom"
                    type="date"
                    value={lastEditFrom}
                    onChange={(e) => setLastEditFrom(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="lastEditTo" className="text-sm font-medium">Última edição até</Label>
                  <Input
                    id="lastEditTo"
                    type="date"
                    value={lastEditTo}
                    onChange={(e) => setLastEditTo(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1 flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            isMobile ? (
              // Skeleton para cards em mobile
              <div className="grid gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-18" />
                      </div>
                      <div className="flex justify-between pt-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              // Skeleton para tabela em desktop
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            )
          )
          : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum documento encontrado para a busca." : "Nenhum documento encontrado."}
              </p>
            </div>
          ) : isMobile ? (
            // Visualização em cards para mobile
            <div className="grid gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{doc.docName}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {doc.docDesc}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailsDialog(doc)}
                        className="ml-2 flex-shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{doc.docCod}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {doc.docResponsible?.enterprise ?? doc.docApprovedManager?.enterprise ?? "N/A"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Processo:</span>
                        <span className="truncate">{doc.docProcess}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Setor:</span>
                        <span className="truncate">{doc.docResponsible?.setor ?? doc.docApprovedManager?.setor ?? "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {doc.updatedAt ? format(new Date(doc.updatedAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {doc.docResponsible?.firstName} {doc.docResponsible?.lastName}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Visualização em tabela para desktop
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Documento</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Última Edição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.docName}</TableCell>
                      <TableCell>{doc.docCod}</TableCell>
                      <TableCell>{doc.docProcess}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.docResponsible?.enterprise ?? doc.docApprovedManager?.enterprise ?? "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{doc.docResponsible?.setor ?? doc.docApprovedManager?.setor ?? "N/A"}</TableCell>
                      <TableCell>
                        {doc.updatedAt ? format(new Date(doc.updatedAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailsDialog(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhes */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detalhes do Documento</DialogTitle>
          </DialogHeader>

          {detailsDocument && (
            <div className="space-y-4 sm:space-y-6">
              {/* Nome do documento destacado */}
              <div className="pb-4 border-b">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  {detailsDocument.docName}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {detailsDocument.docDesc}
                </p>
              </div>

              {/* Grid responsivo com informações principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <Label className="font-semibold text-sm">Código</Label>
                    <p className="text-sm text-muted-foreground">{detailsDocument.docCod}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Building className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <Label className="font-semibold text-sm">Empresa</Label>
                    <Badge variant="outline" className="mt-1">
                      {detailsDocument.docResponsible?.enterprise ?? detailsDocument.docApprovedManager?.enterprise ?? "N/A"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Processo:</span>
                  <span className="text-sm text-foreground">{detailsDocument.docProcess}</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Setor:</span>
                  <span className="text-sm text-foreground">{detailsDocument.docResponsible?.setor ?? detailsDocument.docApprovedManager?.setor ?? "N/A"}</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
                  <span className="text-sm text-foreground">{detailsDocument.docTypeArc}</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <Label className="font-semibold text-sm">Responsável</Label>
                    <p className="text-sm text-muted-foreground">
                      {detailsDocument.docResponsible?.firstName} {detailsDocument.docResponsible?.lastName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="font-semibold text-sm">Disponibilidade</Label>
                  <p className="text-sm text-muted-foreground mt-1">{detailsDocument.docAvailability}</p>
                </div>

                <div className="sm:col-span-1">
                  <Label className="font-semibold text-sm">Datas</Label>
                  <div className="space-y-1 mt-1">
                    <p className="text-xs text-muted-foreground">
                      Criado: {detailsDocument.createdAt ? format(new Date(detailsDocument.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Última edição: {detailsDocument.updatedAt ? format(new Date(detailsDocument.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
