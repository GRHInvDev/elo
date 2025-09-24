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
import { api } from "@/trpc/react"
import { Phone, Users, Search, ChevronDown, ChevronRight } from "lucide-react"
import { CustomExtension } from "@prisma/client"

export default function ExtensionListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set())

    interface ListaSetores {
        sector: string;
        users: { 
            id: string; 
            email: string; 
            firstName: string | null; 
            lastName: string | null; 
            setor: string | null; 
            extension: number | null 
        }[];
        totalUsers: number;
    }
  
  const { data: extensionsBySector, isLoading } = api.user.listExtensions.useQuery()
  const { data: customExtensions } = api.user.listCustomExtensions.useQuery()

  // Transformar dados agrupados em array para renderização
  const sectorsList: ListaSetores[] = useMemo(() => {
    if (!extensionsBySector) return []

    return Object.entries(extensionsBySector).map(([sector, users]) => ({
      sector,
      users: (users as Array<{ id: string; email: string; firstName: string | null; lastName: string | null; setor: string | null; extension: number | null }>) ?? [],
      totalUsers: users?.length ?? 0,
    }))
  }, [extensionsBySector])

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

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lista de ramais</h2>
          <p className="text-muted-foreground">
            Lista de ramais telefônicos organizados por setor em ordem alfabética
          </p>
        </div>

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
                                    {user.email}
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

        {/* Ramais Personalizados */}
        {customExtensions && customExtensions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Ramais Personalizados
              </CardTitle>
              <CardDescription>
                Ramais personalizados criados para contatos externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {customExtensions
                  .filter(customExtension =>
                    searchTerm === "" ??
                    customExtension.name.toLowerCase().includes(searchTerm.toLowerCase()) ??
                    customExtension.email?.toLowerCase().includes(searchTerm.toLowerCase()) ??
                    customExtension.extension.toString().includes(searchTerm.toLowerCase()) ??
                    customExtension.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((customExtension: CustomExtension) => (
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
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
