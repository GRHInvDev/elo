"use client"

import { useState, useMemo } from "react"
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
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
} from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { ENTERPRISE_VALUES, type Enterprise } from "@/types/enterprise"

const FILIAL_ENTERPRISE_OPTIONS = ENTERPRISE_VALUES.filter((e) => e !== "NA")

type EmpresaItem = {
  id: string
  name: string
  enterprise: Enterprise
  filiais: { id: string }[]
}

type FilialItem = {
  id: string
  name: string
  code: string
  empresaId: string
  empresa: {
    id: string
    name: string
    enterprise: Enterprise
  }
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
  // ── filial state ────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilialId, setSelectedFilialId] = useState<string>("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [isCreateFilialOpen, setIsCreateFilialOpen] = useState(false)
  const [isEditFilialOpen, setIsEditFilialOpen] = useState(false)
  const [isDeleteFilialOpen, setIsDeleteFilialOpen] = useState(false)
  const [selectedFilial, setSelectedFilial] = useState<FilialItem | null>(null)
  const [filialForm, setFilialForm] = useState({ name: "", code: "", empresaId: "" })

  // ── empresa state ───────────────────────────────────────────────────────────
  const [isCreateEmpresaOpen, setIsCreateEmpresaOpen] = useState(false)
  const [isEditEmpresaOpen, setIsEditEmpresaOpen] = useState(false)
  const [isDeleteEmpresaOpen, setIsDeleteEmpresaOpen] = useState(false)
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaItem | null>(null)
  const [empresaForm, setEmpresaForm] = useState<{ name: string; enterprise: Enterprise | "" }>({
    name: "",
    enterprise: "",
  })

  // ── filial users pagination state ───────────────────────────────────────────
  const [filialUsersPage, setFilialUsersPage] = useState(1)
  const debouncedUserSearch = useDebounce(userSearchTerm, 300)

  // ── user/employee state ─────────────────────────────────────────────────────
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false)
  const [isEditUserFilialOpen, setIsEditUserFilialOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [selectedUserFilialId, setSelectedUserFilialId] = useState<string>("")
  const [selectedUserEnterprise, setSelectedUserEnterprise] = useState<Enterprise>("NA")

  const { isSudo, hasAdminAccess } = useAccessControl()
  const hasAccess = isSudo || hasAdminAccess("/admin/filiais")

  const { toast } = useToast()
  const utils = api.useUtils()

  // ── queries ─────────────────────────────────────────────────────────────────
  const { data: empresasData = [], isLoading: isLoadingEmpresas, refetch: refetchEmpresas } =
    api.empresas.list.useQuery()
  const empresas = empresasData as EmpresaItem[]

  const { data: filiaisData = [], isLoading: isLoadingFiliais, refetch: refetchFiliais } =
    api.filiais.list.useQuery()
  const filiais = filiaisData as FilialItem[]

  const { data: filialUsersData, isLoading: isLoadingUsers } = api.filiais.listUsers.useQuery(
    { filialId: selectedFilialId, page: filialUsersPage, pageSize: 10, search: debouncedUserSearch || undefined },
    { enabled: !!selectedFilialId },
  )

  const { data: allUsers = [] } = api.user.listAllUsers.useQuery()

  // ── empresa mutations ───────────────────────────────────────────────────────
  const createEmpresa = api.empresas.create.useMutation({
    onSuccess: async () => {
      toast({ title: "Empresa criada", description: "Empresa criada com sucesso." })
      setEmpresaForm({ name: "", enterprise: "" })
      setIsCreateEmpresaOpen(false)
      await refetchEmpresas()
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  })

  const updateEmpresa = api.empresas.update.useMutation({
    onSuccess: async () => {
      toast({ title: "Empresa atualizada", description: "Empresa atualizada com sucesso." })
      setEmpresaForm({ name: "", enterprise: "" })
      setIsEditEmpresaOpen(false)
      setSelectedEmpresa(null)
      await refetchEmpresas()
      await refetchFiliais()
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  })

  const deleteEmpresa = api.empresas.delete.useMutation({
    onSuccess: async () => {
      toast({ title: "Empresa excluída", description: "Empresa excluída com sucesso." })
      setIsDeleteEmpresaOpen(false)
      setSelectedEmpresa(null)
      await refetchEmpresas()
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  })

  // ── filial mutations ────────────────────────────────────────────────────────
  const createFilial = api.filiais.create.useMutation({
    onSuccess: async () => {
      toast({ title: "Filial criada", description: "Filial criada com sucesso." })
      setFilialForm({ name: "", code: "", empresaId: "" })
      setIsCreateFilialOpen(false)
      await refetchFiliais()
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  })

  const updateFilial = api.filiais.update.useMutation({
    onSuccess: async () => {
      toast({ title: "Filial atualizada", description: "Filial atualizada com sucesso." })
      setFilialForm({ name: "", code: "", empresaId: "" })
      setIsEditFilialOpen(false)
      setSelectedFilial(null)
      await refetchFiliais()
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  })

  const deleteFilial = api.filiais.delete.useMutation({
    onSuccess: async () => {
      toast({ title: "Filial excluída", description: "Filial excluída com sucesso." })
      setIsDeleteFilialOpen(false)
      setSelectedFilial(null)
      await refetchFiliais()
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  })

  const updateUserFilial = api.user.updateUserFilial.useMutation({
    onSuccess: async () => {
      toast({ title: "Empresa/Filial atualizada", description: "Dados do colaborador atualizados." })
      setIsEditUserFilialOpen(false)
      setSelectedUser(null)
      setSelectedUserFilialId("")
      await refetchFiliais()
      await utils.user.listAllUsers.invalidate()
      if (selectedFilialId) {
        await utils.filiais.listUsers.invalidate({ filialId: selectedFilialId })
      }
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  })

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleSaveCreateEmpresa = () => {
    if (!empresaForm.name.trim() || !empresaForm.enterprise) {
      toast({ title: "Campos obrigatórios", description: "Nome e tipo são obrigatórios.", variant: "destructive" })
      return
    }
    createEmpresa.mutate({ name: empresaForm.name.trim(), enterprise: empresaForm.enterprise })
  }

  const handleSaveEditEmpresa = () => {
    if (!selectedEmpresa) return
    if (!empresaForm.name.trim() || !empresaForm.enterprise) {
      toast({ title: "Campos obrigatórios", description: "Nome e tipo são obrigatórios.", variant: "destructive" })
      return
    }
    updateEmpresa.mutate({ id: selectedEmpresa.id, name: empresaForm.name.trim(), enterprise: empresaForm.enterprise })
  }

  const handleSaveCreateFilial = () => {
    if (!filialForm.name.trim() || !filialForm.code.trim() || !filialForm.empresaId) {
      toast({ title: "Campos obrigatórios", description: "Nome, código e empresa são obrigatórios.", variant: "destructive" })
      return
    }
    createFilial.mutate({ name: filialForm.name.trim(), code: filialForm.code.trim(), empresaId: filialForm.empresaId })
  }

  const handleSaveEditFilial = () => {
    if (!selectedFilial) return
    if (!filialForm.name.trim() || !filialForm.code.trim() || !filialForm.empresaId) {
      toast({ title: "Campos obrigatórios", description: "Nome, código e empresa são obrigatórios.", variant: "destructive" })
      return
    }
    updateFilial.mutate({ id: selectedFilial.id, name: filialForm.name.trim(), code: filialForm.code.trim(), empresaId: filialForm.empresaId })
  }

  const handleSaveUserFilial = () => {
    if (!selectedUser) return

    const requiresFilial =
      selectedUserEnterprise === "Box_Filial" || selectedUserEnterprise === "Cristallux_Filial"

    if (requiresFilial && !selectedUserFilialId) {
      toast({ title: "Campo obrigatório", description: "Selecione uma filial.", variant: "destructive" })
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

  // ── derived data ─────────────────────────────────────────────────────────────
  const filteredFiliais = useMemo(
    () =>
      filiais.filter(
        (f) =>
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.code.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [filiais, searchTerm],
  )

  const filialUsers = filialUsersData?.users ?? []
  const filialUsersTotal = filialUsersData?.total ?? 0
  const filialUsersTotalPages = filialUsersData?.totalPages ?? 1
  const filialUsersStart = filialUsersTotal === 0 ? 0 : (filialUsersPage - 1) * 10 + 1
  const filialUsersEnd = Math.min(filialUsersPage * 10, filialUsersTotal)

  const filteredAllUsers = useMemo(() => {
    const q = employeeSearchTerm.toLowerCase()
    if (!q) return allUsers
    return allUsers.filter(
      (u) =>
        `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    )
  }, [allUsers, employeeSearchTerm])

  // Filiais compatíveis com o enterprise selecionado para o usuário
  const filiaisForUserEnterprise = useMemo(
    () =>
      filiais.filter((f) => f.empresa.enterprise === selectedUserEnterprise),
    [filiais, selectedUserEnterprise],
  )

  if (!hasAccess) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Acesso Negado</h3>
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
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
              Gerencie empresas, filiais e o vínculo dos colaboradores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setSelectedEmpresa(null); setEmpresaForm({ name: "", enterprise: "" }); setIsCreateEmpresaOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
            <Button onClick={() => { setSelectedFilial(null); setFilialForm({ name: "", code: "", empresaId: "" }); setIsCreateFilialOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Filial
            </Button>
          </div>
        </div>

        <Tabs defaultValue="empresas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="filiais">Filiais</TabsTrigger>
          </TabsList>

          {/* ── Empresas tab ──────────────────────────────────────────────── */}
          <TabsContent value="empresas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Empresas Cadastradas ({empresas.length})
                </CardTitle>
                <CardDescription>
                  Empresas que agrupam filiais. Cada filial pertence a uma empresa.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEmpresas ? (
                  <div className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto h-8 w-8 text-muted-foreground" />
                  </div>
                ) : empresas.length > 0 ? (
                  <div className="space-y-2">
                    {empresas.map((empresa) => (
                      <div
                        key={empresa.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium">{empresa.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs font-normal">
                              {empresa.enterprise.replaceAll("_", " ")}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {empresa.filiais.length} filial(is)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmpresa(empresa)
                              setEmpresaForm({ name: empresa.name, enterprise: empresa.enterprise })
                              setIsEditEmpresaOpen(true)
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmpresa(empresa)
                              setIsDeleteEmpresaOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma empresa cadastrada. Crie uma empresa antes de adicionar filiais.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Filiais tab ───────────────────────────────────────────────── */}
          <TabsContent value="filiais" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Filiais ({filiais.length})
                </CardTitle>
                <CardDescription>{filiais.length} filial(is) cadastrada(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setSearchTerm("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => { setShowEmployeeSearch(true); setEmployeeSearchTerm("") }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Pesquisar Funcionários
                  </Button>
                </div>

                {isLoadingFiliais ? (
                  <div className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Carregando filiais...</p>
                  </div>
                ) : filteredFiliais.length > 0 ? (
                  <div className="space-y-2">
                    {filteredFiliais.map((filial) => (
                      <div key={filial.id}>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="font-medium">{filial.name}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">{filial.code}</span>
                              <Badge variant="secondary" className="text-xs font-normal">
                                {filial.empresa.name}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFilial(filial)
                                setFilialForm({ name: filial.name, code: filial.code, empresaId: filial.empresaId })
                                setIsEditFilialOpen(true)
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedFilial(filial); setIsDeleteFilialOpen(true) }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const next = filial.id === selectedFilialId ? "" : filial.id
                                setSelectedFilialId(next)
                                setFilialUsersPage(1)
                                setUserSearchTerm("")
                              }}
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  filial.id === selectedFilialId ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Nenhuma filial encontrada." : "Nenhuma filial cadastrada."}
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
                    Usuários da Filial: {filiais.find((f) => f.id === selectedFilialId)?.name}
                  </CardTitle>
                  <CardDescription>
                    {filialUsersTotal} usuário(s) nesta filial
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="user-search"
                      placeholder="Buscar usuários por nome ou email..."
                      value={userSearchTerm}
                      onChange={(e) => { setUserSearchTerm(e.target.value); setFilialUsersPage(1) }}
                      className="pl-10"
                    />
                    {userSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => { setUserSearchTerm(""); setFilialUsersPage(1) }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {isLoadingUsers ? (
                    <div className="text-center py-8">
                      <Loader2 className="animate-spin mx-auto h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : filialUsers.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {filialUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleEditUserFilial(user)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Editar Empresa/Filial
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-muted-foreground">
                          Mostrando {filialUsersStart}–{filialUsersEnd} de {filialUsersTotal} usuário(s)
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilialUsersPage((p) => Math.max(1, p - 1))}
                            disabled={filialUsersPage <= 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            {filialUsersPage} / {filialUsersTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilialUsersPage((p) => Math.min(filialUsersTotalPages, p + 1))}
                            disabled={filialUsersPage >= filialUsersTotalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {userSearchTerm ? "Nenhum usuário encontrado." : "Nenhum usuário nesta filial."}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Create/Edit Empresa Modal ─────────────────────────────────────── */}
      <Dialog
        open={isCreateEmpresaOpen || isEditEmpresaOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateEmpresaOpen(false)
            setIsEditEmpresaOpen(false)
            setEmpresaForm({ name: "", enterprise: "" })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEmpresa ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            <DialogDescription>
              {selectedEmpresa ? "Atualize as informações da empresa" : "Preencha os dados para criar uma nova empresa"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="empresa-name">Nome</Label>
              <Input
                id="empresa-name"
                value={empresaForm.name}
                onChange={(e) => setEmpresaForm({ ...empresaForm, name: e.target.value })}
                placeholder="Ex: Box Teste"
              />
            </div>
            <div>
              <Label htmlFor="empresa-enterprise">Tipo</Label>
              <Select
                value={empresaForm.enterprise === "" ? undefined : empresaForm.enterprise}
                onValueChange={(v) => setEmpresaForm({ ...empresaForm, enterprise: v as Enterprise })}
              >
                <SelectTrigger id="empresa-enterprise">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {FILIAL_ENTERPRISE_OPTIONS.map((ent) => (
                    <SelectItem key={ent} value={ent}>
                      {ent.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsCreateEmpresaOpen(false); setIsEditEmpresaOpen(false) }}
            >
              Cancelar
            </Button>
            <Button
              onClick={selectedEmpresa ? handleSaveEditEmpresa : handleSaveCreateEmpresa}
              disabled={createEmpresa.isPending || updateEmpresa.isPending}
            >
              {createEmpresa.isPending || updateEmpresa.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Empresa Dialog ─────────────────────────────────────────── */}
      <AlertDialog open={isDeleteEmpresaOpen} onOpenChange={setIsDeleteEmpresaOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              {`Tem certeza que deseja excluir "${selectedEmpresa?.name ?? ""}"? Não é possível excluir empresas com filiais vinculadas.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEmpresa && deleteEmpresa.mutate({ id: selectedEmpresa.id })}
              disabled={deleteEmpresa.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEmpresa.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Excluindo...</>
              ) : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Create/Edit Filial Modal ──────────────────────────────────────── */}
      <Dialog
        open={isCreateFilialOpen || isEditFilialOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateFilialOpen(false)
            setIsEditFilialOpen(false)
            setFilialForm({ name: "", code: "", empresaId: "" })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFilial ? "Editar Filial" : "Nova Filial"}</DialogTitle>
            <DialogDescription>
              {selectedFilial ? "Atualize as informações da filial" : "Preencha os dados para criar uma nova filial"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filial-name">Nome</Label>
              <Input
                id="filial-name"
                value={filialForm.name}
                onChange={(e) => setFilialForm({ ...filialForm, name: e.target.value })}
                placeholder="Ex: Venâncio Aires"
              />
            </div>
            <div>
              <Label htmlFor="filial-code">Código</Label>
              <Input
                id="filial-code"
                value={filialForm.code}
                onChange={(e) => setFilialForm({ ...filialForm, code: e.target.value.toUpperCase() })}
                placeholder="Ex: VA"
              />
            </div>
            <div>
              <Label htmlFor="filial-empresa">Empresa</Label>
              <Select
                value={filialForm.empresaId === "" ? undefined : filialForm.empresaId}
                onValueChange={(v) => setFilialForm({ ...filialForm, empresaId: v })}
              >
                <SelectTrigger id="filial-empresa">
                  <SelectValue placeholder="Selecione a empresa desta filial" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsCreateFilialOpen(false); setIsEditFilialOpen(false) }}
            >
              Cancelar
            </Button>
            <Button
              onClick={selectedFilial ? handleSaveEditFilial : handleSaveCreateFilial}
              disabled={createFilial.isPending || updateFilial.isPending}
            >
              {createFilial.isPending || updateFilial.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
              ) : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Filial Dialog ──────────────────────────────────────────── */}
      <AlertDialog open={isDeleteFilialOpen} onOpenChange={setIsDeleteFilialOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Filial</AlertDialogTitle>
            <AlertDialogDescription>
              {`Tem certeza que deseja excluir "${selectedFilial?.name ?? ""}"? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFilial && deleteFilial.mutate({ id: selectedFilial.id })}
              disabled={deleteFilial.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFilial.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Excluindo...</>
              ) : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Edit User Filial Modal ────────────────────────────────────────── */}
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
                onValueChange={(v) => {
                  setSelectedUserEnterprise(v as Enterprise)
                  setSelectedUserFilialId("")
                }}
              >
                <SelectTrigger id="user-enterprise-select">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {ENTERPRISE_VALUES.map((ent) => (
                    <SelectItem key={ent} value={ent}>
                      {ent.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(selectedUserEnterprise === "Box_Filial" || selectedUserEnterprise === "Cristallux_Filial") && (
              <div>
                <Label htmlFor="user-filial-select">Filial</Label>
                <Select
                  value={selectedUserFilialId || "none"}
                  onValueChange={(v) => setSelectedUserFilialId(v === "none" ? "" : v)}
                >
                  <SelectTrigger id="user-filial-select">
                    <SelectValue placeholder="Selecione uma filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem filial</SelectItem>
                    {filiaisForUserEnterprise.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
            <Button onClick={handleSaveUserFilial} disabled={updateUserFilial.isPending}>
              {updateUserFilial.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
              ) : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Search Employees Modal ────────────────────────────────────────── */}
      <Dialog
        open={showEmployeeSearch}
        onOpenChange={(open) => {
          setShowEmployeeSearch(open)
          if (!open) setEmployeeSearchTerm("")
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
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowEmployeeSearch(false); handleEditUserFilial(user) }}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Alterar Empresa/Filial
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum funcionário encontrado.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
