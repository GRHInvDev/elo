"use client"

import { useMemo, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import { Phone, Users, Edit3, Save, X, Shield, Plus, Trash2, Edit, UserPlus } from "lucide-react"
import type { CustomExtension } from "@prisma/client"

type CustomExtensionWithCreator = CustomExtension & {
  createdBy: {
    firstName: string | null
    lastName: string | null
  }
}

export default function ExtensionManagementPage() {
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editingExtension, setEditingExtension] = useState("")

  // Estados para ramais personalizados
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCustomExtension, setEditingCustomExtension] = useState<CustomExtensionWithCreator | null>(null)
  const [customExtensionForm, setCustomExtensionForm] = useState({
    name: "",
    email: "",
    extension: "",
    description: "",
  })

  const { data: extensionsBySector, isLoading, refetch } = api.user.listExtensions.useQuery()
  const { data: customExtensions, refetch: refetchCustom } = api.user.listCustomExtensions.useQuery()
  const { toast } = useToast()
  const { isSudo } = useAccessControl()

  // Verificar permissão - só sudo ou quem tem permissão específica pode gerenciar ramais
  const currentUser = api.user.me.useQuery().data
  const canManageExtensions = isSudo || ((currentUser?.role_config as { can_manage_extensions?: boolean })?.can_manage_extensions ?? false)

  // Transformar dados agrupados em array para renderização
  const sectorsList = useMemo(() => {
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
      totalUsers: users?.length,
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
      void refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Mutações para ramais personalizados
  const createCustomExtension = api.user.createCustomExtension.useMutation({
    onSuccess: () => {
      toast({
        title: "Ramal personalizado criado",
        description: "O ramal personalizado foi criado com sucesso.",
      })
      setIsCreateDialogOpen(false)
      setCustomExtensionForm({ name: "", email: "", extension: "", description: "" })
      void refetchCustom()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateCustomExtension = api.user.updateCustomExtension.useMutation({
    onSuccess: () => {
      toast({
        title: "Ramal personalizado atualizado",
        description: "O ramal personalizado foi atualizado com sucesso.",
      })
      setEditingCustomExtension(null)
      setCustomExtensionForm({ name: "", email: "", extension: "", description: "" })
      void refetchCustom()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const deleteCustomExtension = api.user.deleteCustomExtension.useMutation({
    onSuccess: () => {
      toast({
        title: "Ramal personalizado removido",
        description: "O ramal personalizado foi removido com sucesso.",
      })
      void refetchCustom()
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

  // Funções para ramais personalizados
  const handleCreateCustomExtension = () => {
    const extension = parseInt(customExtensionForm.extension)
    if (isNaN(extension) || extension < 1) {
      toast({
        title: "Erro",
        description: "Ramal deve ser um número positivo.",
        variant: "destructive",
      })
      return
    }

    createCustomExtension.mutate({
      name: customExtensionForm.name,
      email: customExtensionForm.email ?? "",
      extension,
      description: customExtensionForm.description ?? "",
    })
  }

  const handleEditCustomExtension = (customExtension: CustomExtensionWithCreator) => {
    setEditingCustomExtension(customExtension)
    setCustomExtensionForm({
      name: customExtension.name,
      email: customExtension.email ?? "",
      extension: customExtension.extension.toString(),
      description: customExtension.description ?? "",
    })
  }

  const handleUpdateCustomExtension = () => {
    if (!editingCustomExtension) return

    const extension = parseInt(customExtensionForm.extension)
    if (isNaN(extension) || extension < 1) {
      toast({
        title: "Erro",
        description: "Ramal deve ser um número positivo.",
        variant: "destructive",
      })
      return
    }

    updateCustomExtension.mutate({
      id: editingCustomExtension.id,
      name: customExtensionForm.name,
      email: customExtensionForm.email ?? "",
      extension,
      description: customExtensionForm.description ?? "",
    })
  }

  const handleCancelCustomEdit = () => {
    setEditingCustomExtension(null)
    setCustomExtensionForm({ name: "", email: "", extension: "", description: "" })
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
                              {user.emailExtension ?? user.email}
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
                                onClick={() => handleEditExtension(user.id, user.extension ?? 0)}
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

        {/* Ramais Personalizados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Ramais Personalizados
                </CardTitle>
                <CardDescription>
                  Ramais personalizados criados manualmente para contatos externos
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Ramal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Ramal Personalizado</DialogTitle>
                    <DialogDescription>
                      Adicione um novo ramal personalizado para contatos externos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="custom-name">Nome *</Label>
                      <Input
                        id="custom-name"
                        value={customExtensionForm.name}
                        onChange={(e) => setCustomExtensionForm({ ...customExtensionForm, name: e.target.value })}
                        placeholder="Nome do contato"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom-email">Email (opcional)</Label>
                      <Input
                        id="custom-email"
                        type="email"
                        value={customExtensionForm.email}
                        onChange={(e) => setCustomExtensionForm({ ...customExtensionForm, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom-extension">Ramal *</Label>
                      <Input
                        id="custom-extension"
                        type="number"
                        min="1"
                        max="99999"
                        value={customExtensionForm.extension}
                        onChange={(e) => setCustomExtensionForm({ ...customExtensionForm, extension: e.target.value })}
                        placeholder="1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom-description">Descrição (opcional)</Label>
                      <Textarea
                        id="custom-description"
                        value={customExtensionForm.description}
                        onChange={(e) => setCustomExtensionForm({ ...customExtensionForm, description: e.target.value })}
                        placeholder="Descrição ou observações"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateCustomExtension}
                      disabled={createCustomExtension.isPending}
                    >
                      {createCustomExtension.isPending ? "Criando..." : "Criar Ramal"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {customExtensions && customExtensions.length > 0 ? (
              <div className="space-y-3">
                {customExtensions.map((customExtension: CustomExtensionWithCreator) => (
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
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="default" className="font-mono">
                            {customExtension.extension}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Criado por {customExtension.createdBy.firstName ?? ''} {customExtension.createdBy.lastName ?? ''}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Dialog
                          open={editingCustomExtension?.id === customExtension.id}
                          onOpenChange={(open) => {
                            if (!open) handleCancelCustomEdit()
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCustomExtension(customExtension)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Ramal Personalizado</DialogTitle>
                              <DialogDescription>
                                Edite as informações do ramal personalizado.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-custom-name">Nome *</Label>
                                <Input
                                  id="edit-custom-name"
                                  value={customExtensionForm.name}
                                  onChange={(e) => setCustomExtensionForm({ ...customExtensionForm, name: e.target.value })}
                                  placeholder="Nome do contato"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-custom-email">Email (opcional)</Label>
                                <Input
                                  id="edit-custom-email"
                                  type="email"
                                  value={customExtensionForm.email}
                                  onChange={(e) => setCustomExtensionForm({ ...customExtensionForm, email: e.target.value })}
                                  placeholder="email@exemplo.com"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-custom-extension">Ramal *</Label>
                                <Input
                                  id="edit-custom-extension"
                                  type="number"
                                  min="1"
                                  max="99999"
                                  value={customExtensionForm.extension}
                                  onChange={(e) => setCustomExtensionForm({ ...customExtensionForm, extension: e.target.value })}
                                  placeholder="1234"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-custom-description">Descrição (opcional)</Label>
                                <Textarea
                                  id="edit-custom-description"
                                  value={customExtensionForm.description}
                                  onChange={(e) => setCustomExtensionForm({ ...customExtensionForm, description: e.target.value })}
                                  placeholder="Descrição ou observações"
                                  rows={3}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={handleCancelCustomEdit}>
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleUpdateCustomExtension}
                                disabled={updateCustomExtension.isPending}
                              >
                                {updateCustomExtension.isPending ? "Salvando..." : "Salvar"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Ramal Personalizado</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover o ramal personalizado &quot;{customExtension.name}&quot;?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCustomExtension.mutate({ id: customExtension.id })}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum ramal personalizado criado ainda.</p>
                <p className="text-sm mt-1">Clique em &quot;Novo Ramal&quot; para adicionar o primeiro.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
