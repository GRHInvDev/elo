"use client"

import { useMemo } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/trpc/react"
import { Phone, Users } from "lucide-react"

export default function ExtensionListPage() {
  const { data: extensionsBySector, isLoading } = api.user.listExtensions.useQuery()

  // Transformar dados agrupados em array para renderização
  const sectorsList = useMemo(() => {
    if (!extensionsBySector) return []

    return Object.entries(extensionsBySector).map(([sector, users]) => ({
      sector,
      users: (users as Array<{ id: string; email: string; firstName: string | null; lastName: string | null; setor: string | null; extension: number | null }>) ?? [],
      totalUsers: users?.length ?? 0,
    }))
  }, [extensionsBySector])

  const totalUsers = useMemo(() => {
    return sectorsList.reduce((total, sector) => total + sector.totalUsers, 0)
  }, [sectorsList])

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ramais</h2>
          <p className="text-muted-foreground">
            Lista de ramais organizados por setor
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuários com ramais ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Setores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sectorsList.length}</div>
              <p className="text-xs text-muted-foreground">
                Setores organizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ramais Configurados</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                Ramais disponíveis
              </p>
            </CardContent>
          </Card>
        </div>

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
        ) : sectorsList.length > 0 ? (
          <div className="space-y-6">
            {sectorsList.map(({ sector, users, totalUsers: sectorTotal }) => (
              <Card key={sector}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {sector}
                      </CardTitle>
                      <CardDescription>
                        {sectorTotal} colaborador{sectorTotal !== 1 ? 'es' : ''}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {sectorTotal}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
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
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum ramal encontrado</h3>
              <p className="text-muted-foreground text-center">
                Ainda não há ramais configurados no sistema.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
