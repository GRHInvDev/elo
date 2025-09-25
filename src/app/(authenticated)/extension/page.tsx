"use client"

import { useMemo, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import { useToast } from "@/hooks/use-toast"
import { Phone, Users, Search, ChevronDown, ChevronRight, Plus, UserPlus, ArrowUp, ArrowDown, X, Filter } from "lucide-react"
import type { CustomExtension } from "@prisma/client"

type CustomExtensionWithCreator = CustomExtension & {
  createdBy: {
    firstName: string | null
    lastName: string | null
  }
}

export default function ExtensionListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set())

  // Estados para filtros da tabela
  const [tableFilters, setTableFilters] = useState({
    sortBy: 'name' as 'name' | 'email' | 'extension' | 'setor',
    sortOrder: 'asc' as 'asc' | 'desc',
    nameFilter: '',
    emailFilter: '',
    extensionFilter: '',
    setorFilter: '',
  })

  // Estado para o modal de adicionar contato
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    extension: "",
    description: "",
    setor: "",
  })

  // Verificar permissões
  const { canManageExtensions } = useAccessControl()

interface ListaSetores {
    sector: string;
    users: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        setor: string;
        extension: number | null;
        emailExtension: string | null;
    }[];
    totalUsers: number;
}

  const { data: extensionsBySector, isLoading } = api.user.listExtensions.useQuery()
  const { data: customExtensions, refetch: refetchCustomExtensions } = api.user.listCustomExtensions.useQuery()
  const { toast } = useToast()

  // Mutation para criar contato personalizado
  const createCustomExtension = api.user.createCustomExtension.useMutation({
    onSuccess: (data) => {
      setIsAddContactOpen(false)
      setContactForm({ name: "", email: "", extension: "", description: "", setor: "" })
      void refetchCustomExtensions()

      toast({
        title: "✅ Contato adicionado com sucesso!",
        description: `O contato "${data.name}" foi adicionado à lista de ramais.`,
      })
    },
    onError: (error) => {
      console.error("Erro ao criar contato:", error)

      // Mensagens específicas para diferentes tipos de erro
      let errorMessage = "Ocorreu um erro ao adicionar o contato."

      if (error.message?.includes("Este ramal já está sendo usado")) {
        errorMessage = "Este ramal já está sendo usado por outro contato."
      } else if (error.message?.includes("Você não tem permissão")) {
        errorMessage = "Você não tem permissão para adicionar contatos manuais."
      } else if (error.message?.includes("Nome é obrigatório")) {
        errorMessage = "O nome do contato é obrigatório."
      } else if (error.message?.includes("Ramal deve ser")) {
        errorMessage = "O ramal deve ser um número positivo."
      }

      toast({
        title: "❌ Erro ao adicionar contato",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  // Transformar dados agrupados em array para renderização
  const sectorsList: ListaSetores[] = useMemo(() => {
    if (!extensionsBySector) return []

    return Object.entries(extensionsBySector).map(([sector, users]) => ({
      sector,
      users: (users as Array<{ 
        id: string; 
        email: string; 
        firstName: string | null; 
        lastName: string | null; 
        setor: string; 
        extension: number | null; 
        emailExtension: string | null 
    }>) ?? [],
      totalUsers: users?.length ?? 0,
    }))
  }, [extensionsBySector])

  // Lista de setores disponíveis
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>()
    sectorsList.forEach(sector => sectors.add(sector.sector))
    if (customExtensions) {
      customExtensions
        .filter(extension => extension.setor)
        .forEach(extension => {
          sectors.add(String(extension.setor))
        })
    }
    return Array.from(sectors).sort()
  }, [sectorsList, customExtensions])

  // Filtrar setores baseado na pesquisa
  const filteredSectorsList = useMemo(() => {
    if (!searchTerm.trim()) return sectorsList

    const term = searchTerm.toLowerCase().trim()
    return sectorsList
      .map(sector => ({
        ...sector,
        users: sector.users.filter(user =>
          user.firstName?.toLowerCase().includes(term) ??
          user.lastName?.toLowerCase().includes(term) ??
          user.email?.toLowerCase().includes(term) ??
          user.emailExtension?.toLowerCase().includes(term) ??
          sector.sector.toLowerCase().includes(term) ??
          user.extension?.toString().includes(term)
        )
      }))
      .filter(sector => sector.users.length > 0)
  }, [sectorsList, searchTerm])

  const totalUsers = useMemo(() => {
    return sectorsList.reduce((total, sector) => total + sector.totalUsers, 0)
  }, [sectorsList])

  const filteredTotalUsers = useMemo(() => {
    return filteredSectorsList.reduce((total, sector) => total + sector.totalUsers, 0)
  }, [filteredSectorsList])

  // Dados combinados para a tabela (usuários + contatos manuais)
  const allContacts = useMemo(() => {
    const users: Array<{
      id: string
      name: string
      email: string | null
      extension: number
      setor: string
      type: 'Colaborador'
    }> = []

    const customContacts: Array<{
      id: string
      name: string
      email: string | null
      extension: number
      setor: string
      type: 'Manual'
    }> = []

    // Adicionar usuários
    sectorsList.forEach(sector => {
      sector.users.forEach(user => {
        users.push({
          id: user.id,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Nome não informado',
          email: user.emailExtension ?? user.email,
          extension: user.extension ?? 0,
          setor: user.setor,
          type: 'Colaborador' as const,
        })
      })
    })

    // Adicionar contatos manuais
    if (customExtensions) {
      customExtensions.forEach(contact => {
        customContacts.push({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          extension: contact.extension,
          setor: contact.setor!,
          type: 'Manual' as const,
        })
      })
    }

    return [...users, ...customContacts]
  }, [sectorsList, customExtensions])

  // Dados filtrados e ordenados para a tabela
  const filteredAndSortedContacts = useMemo(() => {
    const filtered = allContacts.filter(contact => {
      const matchesName = tableFilters.nameFilter === '' ||
        contact.name.toLowerCase().includes(tableFilters.nameFilter.toLowerCase())

      const matchesEmail = tableFilters.emailFilter === '' ||
        (contact.email?.toLowerCase().includes(tableFilters.emailFilter.toLowerCase()) ?? false)

      const matchesExtension = tableFilters.extensionFilter === '' ||
        contact.extension.toString().includes(tableFilters.extensionFilter)

      const matchesSetor = tableFilters.setorFilter === '' ||
        contact.setor.toLowerCase().includes(tableFilters.setorFilter.toLowerCase())

      return matchesName && matchesEmail && matchesExtension && matchesSetor
    })

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (tableFilters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'email':
          aValue = (a.email ?? '').toLowerCase()
          bValue = (b.email ?? '').toLowerCase()
          break
        case 'extension':
          aValue = a.extension
          bValue = b.extension
          break
        case 'setor':
          aValue = a.setor.toLowerCase()
          bValue = b.setor.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return tableFilters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return tableFilters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [allContacts, tableFilters])

  // Funções para controlar expansão/colapso
  const toggleSector = (sectorName: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectorName)) {
        newSet.delete(sectorName)
      } else {
        newSet.add(sectorName)
      }
      return newSet
    })
  }

  const expandAll = () => {
    setExpandedSectors(new Set(filteredSectorsList.map(s => s.sector)))
  }

  const collapseAll = () => {
    setExpandedSectors(new Set())
  }

  // Função para adicionar contato
  const handleAddContact = () => {
    const extension = parseInt(contactForm.extension)
    if (isNaN(extension) || extension < 1) {
      console.error("Ramal deve ser um número positivo")
      return
    }

    createCustomExtension.mutate({
      name: contactForm.name,
      email: contactForm.email || undefined,
      extension,
      description: contactForm.description || undefined,
      setor: contactForm.setor || undefined,
    })
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Lista de ramais</h2>
            <p className="text-muted-foreground">
              Lista de ramais telefônicos organizados por setor em ordem alfabética
            </p>
          </div>
          {canManageExtensions() && (
            <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Contato
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Contato Manual</DialogTitle>
                <DialogDescription>
                  Adicione um contato personalizado à lista de ramais.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contact-name">Nome *</Label>
                  <Input
                    id="contact-name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Nome do contato"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email">Email (opcional)</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-extension">Ramal/Telefone *</Label>
                  <Input
                    id="contact-extension"
                    type="number"
                    min="1"
                    max="99999999999"
                    value={contactForm.extension}
                    onChange={(e) => setContactForm({ ...contactForm, extension: e.target.value })}
                    placeholder="1234 ou 11987654321"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-setor">Setor (opcional)</Label>
                  <Select
                    value={contactForm.setor}
                    onValueChange={(value) => setContactForm({ ...contactForm, setor: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem setor</SelectItem>
                      {availableSectors.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contact-description">Descrição (opcional)</Label>
                  <Textarea
                    id="contact-description"
                    value={contactForm.description}
                    onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                    placeholder="Descrição ou observações"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddContactOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddContact}
                  disabled={createCustomExtension.isPending || !contactForm.name.trim() || !contactForm.extension.trim()}
                >
                  {createCustomExtension.isPending ? "Adicionando..." : "Adicionar Contato"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Abas para visualização */}
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards">Visualização por Setor</TabsTrigger>
            <TabsTrigger value="table">Tabela Completa</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            {/* Campo de busca e controles */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Ramais
            </CardTitle>
            <CardDescription>
              Digite o nome, email, setor ou ramal para filtrar colaboradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Busca</Label>
                <Input
                  id="search"
                  placeholder="Digite para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={expandAll} size="sm">
                  Expandir Todos
                </Button>
                <Button variant="outline" onClick={collapseAll} size="sm">
                  Recolher Todos
                </Button>
              </div>
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-muted-foreground">
                {filteredTotalUsers === totalUsers
                  ? `${totalUsers} colaborador(es) encontrado(s)`
                  : `${filteredTotalUsers} de ${totalUsers} colaborador(es) encontrado(s)`
                }
              </div>
            )}
            </CardContent>
          </Card>

          {/* Lista de setores */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-muted rounded-full"></div>
                        <div className="space-y-1 flex-1">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="h-6 bg-muted rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSectorsList.length > 0 ? (
          <div className="space-y-4">
            {filteredSectorsList.map(({ sector, users, totalUsers: sectorTotal }) => {
              const isExpanded = expandedSectors.has(sector)
              return (
                <Collapsible key={sector} open={isExpanded} onOpenChange={() => toggleSector(sector)}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <CardTitle className="flex items-center gap-2 text-left">
                                <Users className="h-5 w-5" />
                                {sector}
                              </CardTitle>
                              <CardDescription>
                                {sectorTotal} colaborador{sectorTotal !== 1 ? 'es' : ''}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-sm">
                            {sectorTotal}
                          </Badge>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="grid gap-3">
                          {users.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={undefined} alt={`${user.firstName} ${user.lastName}`} />
                                  <AvatarFallback>
                                    {user.firstName?.charAt(0) ?? ''}
                                    {user.lastName?.charAt(0) ?? ''}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {user.emailExtension ?? user.email}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <Badge variant={user.extension && user.extension > 0 ? "default" : "secondary"} className="font-mono">
                                    {user.extension && user.extension > 0 ? user.extension : 'Não definido'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "Nenhum resultado encontrado" : "Nenhum ramal encontrado"}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchTerm
                  ? "Tente ajustar os termos da busca ou limpe o filtro para ver todos os ramais."
                  : "Ainda não há ramais configurados no sistema."
                }
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  className="mt-4"
                >
                  Limpar busca
                </Button>
              )}
            </CardContent>
          </Card>
        )}

          {/* Contatos Adicionados Manualmente */}
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Contatos Adicionados Manualmente
            </CardTitle>
            <CardDescription>
              Contatos personalizados adicionados à lista de ramais
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customExtensions && customExtensions.length > 0 ? (
              <div className="grid gap-4">
                {customExtensions
                  .filter(customExtension =>
                    searchTerm === "" ||
                    customExtension.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (customExtension.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                    customExtension.extension.toString().includes(searchTerm.toLowerCase()) ||
                    (customExtension.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
                  )
                  .map((customExtension: CustomExtensionWithCreator) => (
                    <div
                      key={customExtension.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {customExtension.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customExtension.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customExtension.email ?? "Sem email"}
                          </div>
                          {customExtension.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {customExtension.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="secondary" className="font-mono">
                            {customExtension.extension}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contato manual adicionado ainda.</p>
                <p className="text-sm mt-1">Use o botão &quot;Adicionar Contato&quot; para incluir novos contatos.</p>
              </div>
            )}
            </CardContent>
          </Card>
          </TabsContent>

          {/* Aba da Tabela Completa */}
          <TabsContent value="table" className="space-y-6">
            {/* Controles de Filtro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros e Ordenação
                </CardTitle>
                <CardDescription>
                  Configure filtros e ordenação para a tabela de ramais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Filtro por Nome */}
                  <div>
                    <Label htmlFor="table-name-filter">Nome</Label>
                    <div className="relative">
                      <Input
                        id="table-name-filter"
                        placeholder="Filtrar por nome..."
                        value={tableFilters.nameFilter}
                        onChange={(e) => setTableFilters(prev => ({ ...prev, nameFilter: e.target.value }))}
                        className="pr-8"
                      />
                      {tableFilters.nameFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-6 w-6 p-0"
                          onClick={() => setTableFilters(prev => ({ ...prev, nameFilter: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtro por Email */}
                  <div>
                    <Label htmlFor="table-email-filter">Email</Label>
                    <div className="relative">
                      <Input
                        id="table-email-filter"
                        placeholder="Filtrar por email..."
                        value={tableFilters.emailFilter}
                        onChange={(e) => setTableFilters(prev => ({ ...prev, emailFilter: e.target.value }))}
                        className="pr-8"
                      />
                      {tableFilters.emailFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-6 w-6 p-0"
                          onClick={() => setTableFilters(prev => ({ ...prev, emailFilter: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtro por Ramal */}
                  <div>
                    <Label htmlFor="table-extension-filter">Ramal</Label>
                    <div className="relative">
                      <Input
                        id="table-extension-filter"
                        placeholder="Filtrar por ramal..."
                        value={tableFilters.extensionFilter}
                        onChange={(e) => setTableFilters(prev => ({ ...prev, extensionFilter: e.target.value }))}
                        className="pr-8"
                      />
                      {tableFilters.extensionFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-6 w-6 p-0"
                          onClick={() => setTableFilters(prev => ({ ...prev, extensionFilter: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtro por Setor */}
                  <div>
                    <Label htmlFor="table-setor-filter">Setor</Label>
                    <div className="relative">
                      <Input
                        id="table-setor-filter"
                        placeholder="Filtrar por setor..."
                        value={tableFilters.setorFilter}
                        onChange={(e) => setTableFilters(prev => ({ ...prev, setorFilter: e.target.value }))}
                        className="pr-8"
                      />
                      {tableFilters.setorFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-6 w-6 p-0"
                          onClick={() => setTableFilters(prev => ({ ...prev, setorFilter: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controles de Ordenação */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Ordenar por:</Label>
                    <Select
                      value={tableFilters.sortBy}
                      onValueChange={(value: 'name' | 'email' | 'extension' | 'setor') =>
                        setTableFilters(prev => ({ ...prev, sortBy: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nome</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="extension">Ramal</SelectItem>
                        <SelectItem value="setor">Setor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTableFilters(prev => ({
                      ...prev,
                      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                    }))}
                    className="flex items-center gap-2"
                  >
                    {tableFilters.sortOrder === 'asc' ? (
                      <>
                        <ArrowUp className="h-4 w-4" />
                        Crescente
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-4 w-4" />
                        Decrescente
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTableFilters({
                      sortBy: 'name',
                      sortOrder: 'asc',
                      nameFilter: '',
                      emailFilter: '',
                      extensionFilter: '',
                      setorFilter: '',
                    })}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpar Filtros
                  </Button>

                  <div className="ml-auto text-sm text-muted-foreground">
                    {filteredAndSortedContacts.length} resultado{filteredAndSortedContacts.length !== 1 ? 's' : ''} encontrado{filteredAndSortedContacts.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Todos os Contatos de Ramal
                </CardTitle>
                <CardDescription>
                  Visualização completa de todos os ramais organizados em tabela
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ramal</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedContacts.length > 0 ? (
                      filteredAndSortedContacts.map(contact => (
                        <TableRow key={`${contact.type}-${contact.id}`}>
                          <TableCell className="font-medium">
                            {contact.name}
                          </TableCell>
                          <TableCell>{contact.email ?? 'Sem email'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={contact.type === 'Colaborador' ? 'default' : 'secondary'}
                              className="font-mono"
                            >
                              {contact.extension}
                            </Badge>
                          </TableCell>
                          <TableCell>{contact.setor}</TableCell>
                          <TableCell>
                            <Badge variant={contact.type === 'Colaborador' ? 'outline' : 'secondary'}>
                              {contact.type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum contato encontrado com os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
