"use client"

import { useState, useMemo, useCallback } from "react"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Search,
  X,
  ChevronDown,
  Users,
  Loader2,
} from "lucide-react"
import { List, type RowComponentProps } from "react-window"
import { ENTERPRISE_VALUES, type Enterprise } from "@/types/enterprise"

type FilialItem = {
  id: string
  name: string
  code: string
}

type UserItem = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  enterprise: Enterprise | null
  filialId?: string | null
}

export default function FiliaisManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilialId, setSelectedFilialId] = useState<string>("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [enterpriseUserSearchTerm, setEnterpriseUserSearchTerm] = useState("")
  const [selectedEnterpriseFilter, setSelectedEnterpriseFilter] = useState<Enterprise | "">("")
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditUserFilialOpen, setIsEditUserFilialOpen] = useState(false)
  const [selectedFilial, setSelectedFilial] = useState<FilialItem | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [formData, setFormData] = useState({ name: "", code: "" })
  const [selectedUserFilialId, setSelectedUserFilialId] = useState<string>("")
  const [selectedUserEnterprise, setSelectedUserEnterprise] = useState<Enterprise>("NA")

  const { isSudo, hasAdminAccess } = useAccessControl()
  const hasAccess = isSudo || hasAdminAccess("/admin/filiais")

  const { toast } = useToast()
  const utils = api.useUtils()

  // Queries
  const { data: filiaisData = [], isLoading: isLoadingFiliais, refetch: refetchFiliais } = api.filiais.list.useQuery()
  const filiais = filiaisData as FilialItem[]

  const { data: filialDetails, isLoading: isLoadingUsers } = api.filiais.getById.useQuery(
    { id: selectedFilialId },
    { enabled: !!selectedFilialId }
  )

  const { data: allUsers = [] } = api.user.listAllUsers.useQuery()

  // Mutations
  const createFilial = api.filiais.create.useMutation({
    onSuccess: async () => {
      toast({
        title: "Filial criada",
        description: "A filial foi criada com sucesso.",
      })
      setFormData({ name: "", code: "" })
      setIsCreateModalOpen(false)
      await refetchFiliais()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateFilial = api.filiais.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Filial atualizada",
        description: "A filial foi atualizada com sucesso.",
      })
      setFormData({ name: "", code: "" })
      setIsEditModalOpen(false)
      setSelectedFilial(null)
      await refetchFiliais()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const deleteFilial = api.filiais.delete.useMutation({
    onSuccess: async () => {
      toast({
        title: "Filial deletada",
        description: "A filial foi deletada com sucesso.",
      })
      setIsDeleteDialogOpen(false)
      setSelectedFilial(null)
      await refetchFiliais()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateUserFilial = api.user.updateUserFilial.useMutation({
    onSuccess: async () => {
      toast({
        title: "Empresa/Filial atualizada",
        description: "A empresa e/ou filial do usuário foi atualizada com sucesso.",
      })
      setIsEditUserFilialOpen(false)
      setSelectedUser(null)
      setSelectedUserFilialId("")
      await refetchFiliais()
      await utils.user.listAllUsers.invalidate()
      if (selectedFilialId) {
        await utils.filiais.getById.invalidate({ id: selectedFilialId })
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Handlers
  const handleCreateClick = () => {
    setSelectedFilial(null)
    setFormData({ name: "", code: "" })
    setIsCreateModalOpen(true)
  }

  const handleEditClick = (filial: FilialItem) => {
    setSelectedFilial(filial)
    setFormData({ name: filial.name, code: filial.code })
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (filial: FilialItem) => {
    setSelectedFilial(filial)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveCreate = () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e código são obrigatórios.",
        variant: "destructive",
      })
      return
    }
    createFilial.mutate({ name: formData.name.trim(), code: formData.code.trim() })
  }

  const handleSaveEdit = () => {
    if (!selectedFilial) return
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e código são obrigatórios.",
        variant: "destructive",
      })
      return
    }
    updateFilial.mutate({
      id: selectedFilial.id,
      name: formData.name.trim(),
      code: formData.code.trim(),
    })
  }

  const handleConfirmDelete = () => {
    if (!selectedFilial) return
    deleteFilial.mutate({ id: selectedFilial.id })
  }

  const handleSaveUserFilial = () => {
    if (!selectedUser) return

    const requiresFilial =
      selectedUserEnterprise === "Box_Filial" || selectedUserEnterprise === "Cristallux_Filial"

    if (requiresFilial && !selectedUserFilialId) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione uma filial para empresas do tipo Filial.",
        variant: "destructive",
      })
      return
    }

    updateUserFilial.mutate({
      userId: selectedUser.id,
      enterprise: selectedUserEnterprise,
      filialId: requiresFilial ? selectedUserFilialId || null : null,
    })
  }

  const handleEditUserFilial = (user: UserItem) => {
    setSelectedUser(user)
    setSelectedUserEnterprise(user.enterprise ?? "NA")
    setSelectedUserFilialId(user.filialId ?? "")
    setIsEditUserFilialOpen(true)
  }

  const handleSearchEmployees = useCallback(() => {
    setShowEmployeeSearch(true)
    setSelectedFilialId("")
    setUserSearchTerm("")
  }, [])

  // Filters
  const filteredFiliais = useMemo(() => {
    return filiais.filter(
      (f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [filiais, searchTerm])

  const filialUsers = useMemo(() => {
    if (!filialDetails?.users) return []
    const q = userSearchTerm.toLowerCase()
    return filialDetails.users.filter((u) =>
      [u.firstName, u.lastName, u.email].some((field) =>
        (field ?? "").toLowerCase().includes(q)
      )
    )
  }, [filialDetails?.users, userSearchTerm])

  const filteredAllUsers = useMemo(() => {
    const normalizedSearch = employeeSearchTerm.toLowerCase()
    if (!normalizedSearch) return allUsers

    return allUsers.filter((user) =>
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch)
    )
  }, [allUsers, employeeSearchTerm])

  const enterpriseOverview = useMemo(() => {
    const users = allUsers

    return ENTERPRISE_VALUES.map((enterprise) => {
      const usersInEnterprise = users.filter((user) => user.enterprise === enterprise).length
      return {
        enterprise,
        usersInEnterprise,
      }
    })
  }, [allUsers])

  const filteredEnterpriseUsers = useMemo(() => {
    if (!selectedEnterpriseFilter) return []

    const normalizedSearch = enterpriseUserSearchTerm.toLowerCase()
    return allUsers.filter((user) => {
      if (user.enterprise !== selectedEnterpriseFilter) return false
      if (!normalizedSearch) return true

      return (
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [allUsers, selectedEnterpriseFilter, enterpriseUserSearchTerm])

  const UserRow = useCallback(
    ({ index, style }: RowComponentProps) => {
      const user = filialUsers[index]
      if (!user) return null

      return (
        <div style={style} className="px-1">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="font-medium">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditUserFilial(user)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar Empresa/Filial
            </Button>
          </div>
        </div>
      )
    },
    [filialUsers]
  )

  const EnterpriseUserRow = useCallback(
    ({ index, style }: RowComponentProps) => {
      const user = filteredEnterpriseUsers[index]
      if (!user) return null

      return (
        <div style={style} className="px-1">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="font-medium">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleEditUserFilial(user)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Editar Empresa/Filial
            </Button>
          </div>
        </div>
      )
    },
    [filteredEnterpriseUsers]
  )

  if (!hasAccess) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Acesso Negado</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gerenciar Empresa</h2>
            <p className="text-muted-foreground">
              Gerencie filiais e o vínculo de empresa/filial dos colaboradores
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Filial
          </Button>
        </div>

        <Tabs defaultValue="empresas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="filiais">Filiais</TabsTrigger>
          </TabsList>

          <TabsContent value="empresas">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Empresas Cadastradas ({enterpriseOverview.length})
                </CardTitle>
                <CardDescription>
                  Empresas disponíveis para vínculo de colaboradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {enterpriseOverview.map((item) => (
                    <div
                      key={item.enterprise}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="font-medium">{item.enterprise.replaceAll("_", " ")}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.usersInEnterprise} colaborador(es)</Badge>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedEnterpriseFilter(item.enterprise)
                            setEnterpriseUserSearchTerm("")
                          }}
                        >
                          Editar Empresa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEnterpriseFilter(item.enterprise)
                            setEnterpriseUserSearchTerm("")
                          }}
                        >
                          Ver Funcionários
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedEnterpriseFilter ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Funcionários da Empresa: {selectedEnterpriseFilter.replaceAll("_", " ")}
                  </CardTitle>
                  <CardDescription>
                    {filteredEnterpriseUsers.length} colaborador(es) encontrado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="enterprise-user-search"
                      placeholder="Buscar funcionários por nome ou email..."
                      value={enterpriseUserSearchTerm}
                      onChange={(e) => setEnterpriseUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {enterpriseUserSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setEnterpriseUserSearchTerm("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {filteredEnterpriseUsers.length > 0 ? (
                    <List
                      rowCount={filteredEnterpriseUsers.length}
                      rowHeight={86}
                      rowComponent={EnterpriseUserRow}
                      rowProps={{}}
                      style={{ height: Math.min(420, filteredEnterpriseUsers.length * 86), width: "100%" }}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum funcionário encontrado para esta empresa.
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="filiais" className="space-y-6">
            {/* Filiais List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Filiais ({filiais.length})
                </CardTitle>
                <CardDescription>
                  {filiais.length} filial(is) cadastrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filial-search"
                    placeholder="Buscar por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleSearchEmployees}>
                    <Search className="h-4 w-4 mr-2" />
                    Pesquisar Funcionários
                  </Button>
                </div>

                {/* Table */}
                {isLoadingFiliais ? (
                  <div className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Carregando filiais...</p>
                  </div>
                ) : filteredFiliais.length > 0 ? (
                  <div className="space-y-2">
                    {filteredFiliais.map((filial) => (
                      <div
                        key={filial.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{filial.name}</div>
                          <div className="text-sm text-muted-foreground">{filial.code}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(filial)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(filial)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFilialId(filial.id === selectedFilialId ? "" : filial.id)}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                filial.id === selectedFilialId ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm
                      ? "Nenhuma filial encontrada para esta busca."
                      : "Nenhuma filial cadastrada."}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Users in selected Filial */}
            {selectedFilialId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários da Filial: {filialDetails?.name}
                  </CardTitle>
                  <CardDescription>
                    {filialUsers.length} usuário(s) nesta filial
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="user-search"
                      placeholder="Buscar usuários por nome ou email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {userSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setUserSearchTerm("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Users List */}
                  {isLoadingUsers ? (
                    <div className="text-center py-8">
                      <Loader2 className="animate-spin mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground mt-2">Carregando usuários...</p>
                    </div>
                  ) : filialUsers.length > 0 ? (
                    <List
                      rowCount={filialUsers.length}
                      rowHeight={86}
                      rowComponent={UserRow}
                      rowProps={{}}
                      style={{ height: Math.min(420, filialUsers.length * 86), width: "100%" }}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {userSearchTerm
                        ? "Nenhum usuário encontrado para esta busca."
                        : "Nenhum usuário nesta filial."}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false)
          setIsEditModalOpen(false)
          setFormData({ name: "", code: "" })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFilial ? "Editar Filial" : "Nova Filial"}</DialogTitle>
            <DialogDescription>
              {selectedFilial
                ? "Atualize as informações da filial"
                : "Preencha os dados para criar uma nova filial"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filial-name">Nome</Label>
              <Input
                id="filial-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: São Paulo"
              />
            </div>
            <div>
              <Label htmlFor="filial-code">Código</Label>
              <Input
                id="filial-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: SP"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false)
                setIsEditModalOpen(false)
                setFormData({ name: "", code: "" })
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={selectedFilial ? handleSaveEdit : handleSaveCreate}
              disabled={createFilial.isPending || updateFilial.isPending}
            >
              {createFilial.isPending || updateFilial.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Filial</AlertDialogTitle>
            <AlertDialogDescription>
              {`Tem certeza que deseja deletar a filial "${selectedFilial?.name ?? ""}"? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteFilial.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFilial.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Filial Modal */}
      <Dialog open={isEditUserFilialOpen} onOpenChange={setIsEditUserFilialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Empresa/Filial do Usuário</DialogTitle>
            <DialogDescription>
              {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-enterprise-select">Empresa</Label>
              <Select
                value={selectedUserEnterprise}
                onValueChange={(value) => {
                  const enterpriseValue = value as Enterprise
                  setSelectedUserEnterprise(enterpriseValue)
                  if (enterpriseValue !== "Box_Filial" && enterpriseValue !== "Cristallux_Filial") {
                    setSelectedUserFilialId("")
                  }
                }}
              >
                <SelectTrigger id="user-enterprise-select">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {ENTERPRISE_VALUES.map((enterprise) => (
                    <SelectItem key={enterprise} value={enterprise}>
                      {enterprise.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedUserEnterprise === "Box_Filial" || selectedUserEnterprise === "Cristallux_Filial" ? (
              <div>
                <Label htmlFor="user-filial-select">Filial</Label>
                <Select
                  value={selectedUserFilialId || "none"}
                  onValueChange={(value) => setSelectedUserFilialId(value === "none" ? "" : value)}
                >
                  <SelectTrigger id="user-filial-select">
                    <SelectValue placeholder="Selecione uma filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem filial</SelectItem>
                    {filiais.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditUserFilialOpen(false)
                setSelectedUser(null)
                setSelectedUserEnterprise("NA")
                setSelectedUserFilialId("")
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUserFilial}
              disabled={updateUserFilial.isPending}
            >
              {updateUserFilial.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Employees Modal */}
      <Dialog
        open={showEmployeeSearch}
        onOpenChange={(open) => {
          setShowEmployeeSearch(open)
          if (!open) {
            setEmployeeSearchTerm("")
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pesquisar Funcionários</DialogTitle>
            <DialogDescription>
              Digite o nome ou e-mail do colaborador para alterar a filial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="employee-search"
                placeholder="Digite o nome do funcionário..."
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
              {employeeSearchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setEmployeeSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[420px] overflow-auto">
              {employeeSearchTerm.trim().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aguardando você digitar o nome do usuário...
                </div>
              ) : filteredAllUsers.length > 0 ? (
                filteredAllUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowEmployeeSearch(false)
                        handleEditUserFilial(user)
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Alterar Empresa/Filial
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum funcionário encontrado para esta busca.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
