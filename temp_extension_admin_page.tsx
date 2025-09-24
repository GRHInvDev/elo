"use client"

import { useMemo, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import { Phone, Users, Edit3, Save, X, Shield } from "lucide-react"

export default function ExtensionManagementPage() {
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editingExtension, setEditingExtension] = useState("")

  const { data: extensionsBySector, isLoading, refetch } = api.user.listExtensions.useQuery()
  const { toast } = useToast()
  const { isSudo } = useAccessControl()

  // Verificar permissão - só sudo ou quem tem permissão específica pode gerenciar ramais
  const currentUser = api.user.me.useQuery().data
  const canManageExtensions = isSudo || (currentUser?.role_config as any)?.can_manage_extensions

  // Transformar dados agrupados em array para renderização
  const sectorsList = useMemo(() => {
    if (!extensionsBySector) return []

    return Object.entries(extensionsBySector).map(([sector, users]) => ({
      sector,
      users,
      totalUsers: users.length,
    }))
  }, [extensionsBySector])

  const totalUsers = useMemo(() => {
    return sectorsList.reduce((total, sector) => total + sector.totalUsers, 0)
  }, [sectorsList])

  const updateExtension = api.user.updateExtension.useMutation({
    onSuccess: () => {
      toast({
        title: "Ramal atualizado",
        description: "O ramal do usuário foi atualizado com sucesso.",
      })
      setEditingUser(null)
      setEditingExtension("")
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleEditExtension = (userId: string, currentExtension: number) => {
    setEditingUser(userId)
    setEditingExtension(currentExtension?.toString() || "")
  }

  const handleSaveExtension = (userId: string) => {
    const extension = parseInt(editingExtension)
    if (isNaN(extension) || extension < 0) {
      toast({
        title: "Erro",
        description: "Ramal deve ser um número positivo.",
        variant: "destructive",
      })
      return
    }

    updateExtension.mutate({
      userId,
      extension,
    })
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setEditingExtension("")
  }

  // Verificar acesso
  if (!canManageExtensions) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Acesso Negado</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para gerenciar ramais de usuários.
            </p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciar Ramais</h2>
          <p className="text-muted-foreground">
            Configure e altere os ramais dos usuários do sistema
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
                Ramais disponíveis para edição
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de setores */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, j) => (
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
                              {user.firstName?.charAt(0) || ''}
                              {user.lastName?.charAt(0) || ''}
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
                        <div className="flex items-center gap-3">
                          {editingUser === user.id ? (
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <Label htmlFor={`extension-${user.id}`} className="text-xs">
                                  Ramal
                                </Label>
                                <Input
                                  id={`extension-${user.id}`}
                                  type="number"
                                  min="0"
                                  max="99999"
                                  value={editingExtension}
                                  onChange={(e) => setEditingExtension(e.target.value)}
                                  className="w-20 h-8 text-sm"
                                  placeholder="0000"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveExtension(user.id)}
                                  disabled={updateExtension.isPending}
                                  className="h-6 w-6 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <Badge
                                    variant={user.extension && user.extension > 0 ? "default" : "secondary"}
                                    className="font-mono"
                                  >
                                    {user.extension && user.extension > 0 ? user.extension : 'Não definido'}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditExtension(user.id, user.extension || 0)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
                Ainda não há usuários para configurar ramais.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
