"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import { 
  Users, 
  Search, 
  Settings, 
  Shield, 
  Edit3, 
  Key, 
  X,
  Save,
  User,
  Lock,
  Route,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import type { RolesConfig } from "@/types/role-config"
import type { Enterprise } from "@prisma/client"

// Extensão temporária do tipo RolesConfig para incluir as novas propriedades
type ExtendedRolesConfig = RolesConfig & {
  can_view_dre_report: boolean
  can_manage_extensions?: boolean
  can_manage_dados_basicos_users?: boolean
  can_manage_produtos?: boolean
  can_create_solicitacoes?: boolean
}
import { ADMIN_ROUTES } from "@/const/admin-routes"

// SISTEMA SIMPLIFICADO: Todos podem visualizar, apenas alguns podem criar
// Removidas constantes não utilizadas

// Lista de setores disponíveis
const AVAILABLE_SETORES = [
  { value: "none", label: "Nenhum setor" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "RECURSOS_HUMANOS", label: "Recursos Humanos" },
  { value: "TI", label: "Tecnologia da Informação" },
  { value: "MARKETING", label: "Marketing" },
  { value: "VENDAS", label: "Vendas" },
  { value: "PRODUCAO", label: "Produção" },
  { value: "COMPRAS", label: "Compras" },
  { value: "QUALIDADE", label: "Qualidade" },
  { value: "LOGISTICA", label: "Logística" },
  { value: "JURIDICO", label: "Jurídico" },
]


const ENTERPRISE_OPTIONS: { value: Enterprise | "all"; label: string }[] = [
  { value: "all", label: "Todas as empresas" },
  { value: "NA", label: "N/A" },
  { value: "Box", label: "Box" },
  { value: "RHenz", label: "RHenz" },
  { value: "Cristallux", label: "Cristallux" },
  { value: "Box_Filial", label: "Box Filial" },
  { value: "Cristallux_Filial", label: "Cristallux Filial" },
]

export default function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSector, setSelectedSector] = useState<string>("all")
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | "all">("all")
  const [isAdminFilter, setIsAdminFilter] = useState<boolean | "all">("all")
  const [offset, setOffset] = useState(0)
  const limit = 10

  const { isSudo, hasAdminAccess, canManageBasicUserData } = useAccessControl()

  // Verificar se tem acesso à página de usuários
  const hasAccess = isSudo || hasAdminAccess("/admin/users") || canManageBasicUserData()

  const { data: usersData, isLoading, refetch } = api.user.listUsers.useQuery({
    search: searchTerm || undefined,
    sector: selectedSector !== "all" ? selectedSector : undefined,
    enterprise: selectedEnterprise !== "all" ? selectedEnterprise : undefined,
    isAdmin: isAdminFilter !== "all" ? isAdminFilter : undefined,
    limit,
    offset,
  })

  const { data: allForms } = api.form.list.useQuery()

  const users = usersData?.users ?? []
  const total = usersData?.total ?? 0
  const hasMore = usersData?.hasMore ?? false

  // Reset offset quando filtros mudarem
  useEffect(() => {
    setOffset(0)
  }, [searchTerm, selectedSector, selectedEnterprise, isAdminFilter])

  // Verificar se tem acesso
  if (!hasAccess) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
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
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie permissões, dados básicos e configurações avançadas de usuários
          </p>
        </div>

        {/* Barra de pesquisa e filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Buscar e Filtrar Usuários
            </CardTitle>
            <CardDescription>
              Use os filtros abaixo para encontrar usuários específicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barra de pesquisa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por nome ou email..."
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

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro de Setor */}
              <div>
                <Label htmlFor="sector">Setor</Label>
                <Select
                  value={selectedSector}
                  onValueChange={setSelectedSector}
                >
                  <SelectTrigger id="sector">
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os setores</SelectItem>
                    {AVAILABLE_SETORES.filter(s => s.value !== "none").map((setor) => (
                      <SelectItem key={setor.value} value={setor.value}>
                        {setor.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Empresa */}
              <div>
                <Label htmlFor="enterprise">Empresa</Label>
                <Select
                  value={selectedEnterprise}
                  onValueChange={(value) => setSelectedEnterprise(value as Enterprise | "all")}
                >
                  <SelectTrigger id="enterprise">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTERPRISE_OPTIONS.map((enterprise) => (
                      <SelectItem key={enterprise.value} value={enterprise.value}>
                        {enterprise.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Admin */}
              <div>
                <Label htmlFor="admin">Tipo de Usuário</Label>
                <Select
                  value={isAdminFilter === "all" ? "all" : isAdminFilter ? "admin" : "user"}
                  onValueChange={(value) => {
                    if (value === "all") setIsAdminFilter("all")
                    else setIsAdminFilter(value === "admin")
                  }}
                >
                  <SelectTrigger id="admin">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Apenas Admins</SelectItem>
                    <SelectItem value="user">Apenas Usuários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuários */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuários ({total})
                </CardTitle>
                <CardDescription>
                  {isLoading 
                    ? "Carregando usuários..." 
                    : `${total} usuário(s) encontrado(s)${offset > 0 ? ` (mostrando ${offset + 1}-${Math.min(offset + limit, total)})` : ""}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Carregando usuários...</p>
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="space-y-4">
                  {users.map((user) => (
                    <UserManagementCard 
                      key={user.id} 
                      user={{
                        ...user,
                        role_config: user.role_config as RolesConfig
                      }}
                      allForms={allForms ?? []}
                      onUserUpdate={() => refetch()}
                    />
                  ))}
                </div>
                
                {/* Paginação */}
                {(offset > 0 || hasMore) && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {Math.floor(offset / limit) + 1} de {Math.ceil(total / limit)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(offset + limit)}
                      disabled={!hasMore || isLoading}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || selectedSector !== "all" || selectedEnterprise !== "all" || isAdminFilter !== "all"
                  ? "Nenhum usuário encontrado para estes filtros." 
                  : "Nenhum usuário encontrado."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

interface UserManagementCardProps {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    setor: string | null
    extension: bigint | null
    role_config: RolesConfig
    emailExtension: string | null
    matricula: string | null
  }
  allForms: { id: string; title: string }[]
  onUserUpdate: () => void
}

function UserManagementCard({ user, allForms, onUserUpdate }: UserManagementCardProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isEditing, setIsEditing] = useState(false)
  const [permissionSearch, setPermissionSearch] = useState("")
  const [formSearch, setFormSearch] = useState("")
  const [showPermissionAutocomplete, setShowPermissionAutocomplete] = useState(false)
  const [showFormAutocomplete, setShowFormAutocomplete] = useState(false)
  
  const { isSudo, canManageBasicUserData } = useAccessControl()
  const canEditBasicOnly = canManageBasicUserData() && !isSudo
  
  // Função auxiliar para obter o nome do setor
  const getSetorLabel = (setorValue: string | null | undefined): string => {
    if (!setorValue) return "Não informado"
    const setor = AVAILABLE_SETORES.find(s => s.value === setorValue)
    return setor ? setor.label : setorValue
  }
  const [basicData, setBasicData] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email,
    setor: user.setor ?? "none",
    extension: user.extension ?? 0n,
    emailExtension: user.emailExtension ?? "",
    matricula: user.matricula ?? "",
  })
  const [permissionsData, setPermissionsData] = useState<ExtendedRolesConfig>(
    {
      sudo: (user.role_config as ExtendedRolesConfig)?.sudo ?? false,
      admin_pages: (user.role_config as ExtendedRolesConfig)?.admin_pages ?? [],
      can_create_form: (user.role_config as ExtendedRolesConfig)?.can_create_form ?? false,
      can_create_event: (user.role_config as ExtendedRolesConfig)?.can_create_event ?? false,
      can_create_flyer: (user.role_config as ExtendedRolesConfig)?.can_create_flyer ?? false,
      can_create_booking: (user.role_config as ExtendedRolesConfig)?.can_create_booking ?? false,
      can_locate_cars: (user.role_config as ExtendedRolesConfig)?.can_locate_cars ?? false,
      can_view_dre_report: (user.role_config as ExtendedRolesConfig)?.can_view_dre_report ?? false,
      can_manage_extensions: (user.role_config as ExtendedRolesConfig)?.can_manage_extensions ?? false,
      can_manage_dados_basicos_users: (user.role_config as ExtendedRolesConfig)?.can_manage_dados_basicos_users ?? false,
      can_create_solicitacoes: (user.role_config as ExtendedRolesConfig)?.can_create_solicitacoes ?? false,
      can_manage_produtos: (user.role_config as ExtendedRolesConfig)?.can_manage_produtos ?? false,
      isTotem: (user.role_config as ExtendedRolesConfig)?.isTotem ?? false,
      visible_forms: (user.role_config as ExtendedRolesConfig)?.visible_forms,
      hidden_forms: (user.role_config as ExtendedRolesConfig)?.hidden_forms,
    }
  )
  const [adminRoutesData, setAdminRoutesData] = useState<string[]>(
    (user.role_config as ExtendedRolesConfig)?.admin_pages || []
  )

  // Sincronizar adminRoutesData com permissionsData.admin_pages
  useEffect(() => {
    const newAdminPages = permissionsData.admin_pages || []
    if (JSON.stringify(adminRoutesData) !== JSON.stringify(newAdminPages)) {
      setAdminRoutesData(newAdminPages)
    }
  }, [adminRoutesData, permissionsData.admin_pages])

  // Sincronizar can_manage_produtos com admin_pages
  useEffect(() => {
    const currentAdminPages = permissionsData.admin_pages || []
    const hasAdminRoute = currentAdminPages.includes("/admin")
    const hasProductsRoute = currentAdminPages.includes("/admin/products")
    
    if (permissionsData.can_manage_produtos) {
      // Se can_manage_produtos está true, garantir que /admin e /admin/products estão na lista
      const newRoutes = [...currentAdminPages]
      if (!hasAdminRoute) {
        newRoutes.push("/admin")
      }
      if (!hasProductsRoute) {
        newRoutes.push("/admin/products")
      }
      
      if (newRoutes.length !== currentAdminPages.length) {
        setPermissionsData({
          ...permissionsData,
          admin_pages: newRoutes
        })
      }
    } else if (!permissionsData.can_manage_produtos && hasProductsRoute) {
      // Remover /admin/products se can_manage_produtos está false mas a rota está na lista
      // Nota: não removemos /admin automaticamente, pois pode ser usado por outras rotas
      setPermissionsData({
        ...permissionsData,
        admin_pages: currentAdminPages.filter(route => route !== "/admin/products")
      })
    }
  }, [permissionsData.can_manage_produtos]) // eslint-disable-line react-hooks/exhaustive-deps

  const { toast } = useToast()
  
  const updateBasicInfo = api.user.updateBasicInfo.useMutation({
    onSuccess: () => {
      toast({
        title: "Dados atualizados",
        description: "Os dados básicos do usuário foram atualizados com sucesso.",
      })
      setIsEditing(false)
      onUserUpdate()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateRoleConfig = api.user.updateRoleConfig.useMutation({
    onSuccess: () => {
      toast({
        title: "Permissões atualizadas",
        description: "As permissões do usuário foram atualizadas com sucesso.",
      })
      setIsEditing(false)
      onUserUpdate()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateFormVisibility = api.form.updateFormVisibility.useMutation({
    onSuccess: () => {
      toast({
        title: "Visibilidade atualizada",
        description: "A visibilidade das solicitações foi atualizada com sucesso.",
      })
      onUserUpdate()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleSaveBasicInfo = () => {
    updateBasicInfo.mutate({
      userId: user.id,
      ...basicData,
      extension: basicData.extension?.toString(),
      setor: basicData.setor === "none" ? "" : basicData.setor,
      emailExtension: basicData.emailExtension || "",
      matricula: basicData.matricula || "",
    })
  }

  const handleSavePermissions = () => {
    updateRoleConfig.mutate({
      userId: user.id,
      roleConfig: {
        sudo: permissionsData.sudo ?? false,
        admin_pages: permissionsData.admin_pages ?? [],
        can_create_form: permissionsData.can_create_form ?? false,
        can_create_event: permissionsData.can_create_event ?? false,
        can_create_flyer: permissionsData.can_create_flyer ?? false,
        can_create_booking: permissionsData.can_create_booking ?? false,
        can_locate_cars: permissionsData.can_locate_cars ?? false,
        can_view_dre_report: permissionsData.can_view_dre_report ?? false,
        can_manage_extensions: permissionsData.can_manage_extensions ?? false,
        can_manage_dados_basicos_users: permissionsData.can_manage_dados_basicos_users ?? false,
        can_manage_produtos: permissionsData.can_manage_produtos ?? false,
        isTotem: permissionsData.isTotem ?? false,
        visible_forms: permissionsData.visible_forms,
        hidden_forms: permissionsData.hidden_forms,
      } as RolesConfig,
    })
  }

  const handleToggleFormVisibility = (formId: string, action: 'show' | 'hide') => {
    updateFormVisibility.mutate({
      userId: user.id,
      formId,
      action,
    })
  }

  const handleSaveAdminRoutes = () => {
    updateRoleConfig.mutate({
      userId: user.id,
      roleConfig: {
        sudo: permissionsData.sudo ?? false,
        admin_pages: adminRoutesData ?? [],
        can_create_form: permissionsData.can_create_form ?? false,
        can_create_event: permissionsData.can_create_event ?? false,
        can_create_flyer: permissionsData.can_create_flyer ?? false,
        can_create_booking: permissionsData.can_create_booking ?? false,
        can_locate_cars: permissionsData.can_locate_cars ?? false,
        can_view_dre_report: permissionsData.can_view_dre_report ?? false,
        isTotem: permissionsData.isTotem ?? false,
        visible_forms: permissionsData.visible_forms,
        hidden_forms: permissionsData.hidden_forms,
      } as RolesConfig,
    })
    setIsEditing(false)
  }

  const handleToggleAdminRoute = (routeId: string) => {
    if (adminRoutesData.includes(routeId)) {
      // Se está removendo /admin, remover todas as outras rotas também
      if (routeId === "/admin") {
        setAdminRoutesData([])
        setPermissionsData({
          ...permissionsData,
          admin_pages: []
        })
      } else {
        setAdminRoutesData(prev => {
          const newRoutes = prev.filter(id => id !== routeId)
          const updatedPermissions = {
            ...permissionsData,
            admin_pages: newRoutes
          }
          
          // Se está removendo /admin/products, também remover can_manage_produtos
          if (routeId === "/admin/products") {
            updatedPermissions.can_manage_produtos = false
          }
          
          setPermissionsData(updatedPermissions)
          return newRoutes
        })
      }
    } else {
      // Se está adicionando uma rota que não seja /admin, garantir que /admin esteja incluído
      if (routeId !== "/admin" && !adminRoutesData.includes("/admin")) {
        setAdminRoutesData(prev => {
          const newRoutes = ["/admin", ...prev, routeId]
          const updatedPermissions = {
            ...permissionsData,
            admin_pages: newRoutes
          }
          
          // Se está adicionando /admin/products, também adicionar can_manage_produtos
          if (routeId === "/admin/products") {
            updatedPermissions.can_manage_produtos = true
          }
          
          setPermissionsData(updatedPermissions)
          return newRoutes
        })
      } else {
        setAdminRoutesData(prev => {
          const newRoutes = [...prev, routeId]
          const updatedPermissions = {
            ...permissionsData,
            admin_pages: newRoutes
          }
          
          // Se está adicionando /admin/products, também adicionar can_manage_produtos
          if (routeId === "/admin/products") {
            updatedPermissions.can_manage_produtos = true
          }
          
          setPermissionsData(updatedPermissions)
          return newRoutes
        })
      }
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {user.email}
                </CardDescription>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {user.setor && (
                <Badge variant="outline" className="text-xs">
                  {getSetorLabel(user.setor)}
                </Badge>
              )}
              {user.role_config?.sudo && (
                <Badge variant="default" className="bg-red-500/10 text-red-700 hover:bg-red-500/20">
                  <Shield className="mr-1 h-3 w-3" />
                  Super Admin
                </Badge>
              )}
              {permissionsData.isTotem && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  TOTEM
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Dados Básicos</span>
              <span className="sm:hidden">Dados</span>
            </TabsTrigger>
            {!canEditBasicOnly && (
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Permissões</span>
                <span className="sm:hidden">Perm.</span>
              </TabsTrigger>
            )}
            {!canEditBasicOnly && !permissionsData.isTotem && (
              <TabsTrigger value="routes" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                <span className="hidden sm:inline">Rotas Admin</span>
                <span className="sm:hidden">Rotas</span>
              </TabsTrigger>
            )}
            {!canEditBasicOnly && !permissionsData.sudo && !permissionsData.isTotem && (
              <TabsTrigger value="forms" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Solicitações</span>
                <span className="sm:hidden">Solic.</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab: Dados Básicos */}
          <TabsContent value="basic" className="mt-4 space-y-4">
            {isEditing ? (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      value={basicData.firstName}
                      onChange={(e) => setBasicData({ ...basicData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      value={basicData.lastName}
                      onChange={(e) => setBasicData({ ...basicData, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={basicData.email}
                      onChange={(e) => setBasicData({ ...basicData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="setor">Setor</Label>
                    <Select
                      value={basicData.setor}
                      onValueChange={(value) => setBasicData({ ...basicData, setor: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_SETORES.map((setor) => (
                          <SelectItem key={setor.value} value={setor.value}>
                            {setor.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="extension">Ramal</Label>
                    <Input
                      id="extension"
                      type="number"
                      min="0"
                      max="99999999999"
                      value={basicData.extension?.toString() ?? ""}
                      onChange={(e) => setBasicData({ ...basicData, extension: e.target.value ? BigInt(e.target.value) : 0n })}
                      placeholder="Digite o ramal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailExtension">Email para Ramal (opcional)</Label>
                    <Input
                      id="emailExtension"
                      type="email"
                      value={basicData.emailExtension}
                      onChange={(e) => setBasicData({ ...basicData, emailExtension: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      type="text"
                      value={basicData.matricula}
                      onChange={(e) => setBasicData({ ...basicData, matricula: e.target.value })}
                      placeholder="Digite a matrícula"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Utilizada para exportação de pedidos
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveBasicInfo} disabled={updateBasicInfo.isPending}>
                    {updateBasicInfo.isPending ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome Completo</Label>
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Setor</Label>
                  <p className="text-sm font-medium">{getSetorLabel(user.setor)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ramal</Label>
                  <p className="text-sm font-medium">{user.extension && user.extension > 0n ? user.extension : 'Não definido'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email para Ramal</Label>
                  <p className="text-sm font-medium">{user.emailExtension ?? 'Usa email padrão'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Matrícula</Label>
                  <p className="text-sm font-medium">{user.matricula ?? 'Não informado'}</p>
                </div>
                <div className="md:col-span-2 pt-2">
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar Dados
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab: Permissões */}
          {!canEditBasicOnly && (
            <TabsContent value="permissions" className="mt-4 space-y-4">
              {isEditing ? (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  {/* Seção de Admin */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-semibold">Tipo de Usuário</Label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                        <Checkbox
                          id="sudo"
                          checked={permissionsData.sudo}
                          onCheckedChange={(checked) => {
                            setPermissionsData({ 
                              ...permissionsData, 
                              sudo: checked === true,
                              admin_pages: checked === true ? ["/admin", "/food", "/rooms", "/ideas", "/birthday"] : []
                            });
                          }}
                        />
                        <Label htmlFor="sudo" className="font-medium text-red-700 dark:text-red-400 cursor-pointer">
                          Super Admin (Acesso Total)
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                        <Checkbox
                          id="isTotem"
                          checked={permissionsData.isTotem ?? false}
                          onCheckedChange={(checked) => {
                            setPermissionsData({ 
                              ...permissionsData, 
                              isTotem: checked === true
                            });
                          }}
                        />
                        <Label htmlFor="isTotem" className="font-medium text-yellow-700 dark:text-yellow-400 cursor-pointer">
                          Usuário TOTEM (Acesso Limitado)
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Seção de Permissões de Criação */}
                  {!permissionsData.sudo && !permissionsData.isTotem && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm font-semibold">Permissões de Criação</Label>
                        </div>
                        
                        {/* Barra de pesquisa com autocomplete */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                          <Input
                            placeholder="Buscar permissão..."
                            value={permissionSearch}
                            onChange={(e) => {
                              setPermissionSearch(e.target.value)
                              setShowPermissionAutocomplete(e.target.value.length > 0)
                            }}
                            onFocus={() => setShowPermissionAutocomplete(permissionSearch.length > 0)}
                            onBlur={() => setTimeout(() => setShowPermissionAutocomplete(false), 200)}
                            className="pl-10"
                          />
                          {permissionSearch && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 z-10"
                              onClick={() => {
                                setPermissionSearch("")
                                setShowPermissionAutocomplete(false)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Autocomplete */}
                          {showPermissionAutocomplete && permissionSearch && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                              {[
                                "Criar Solicitações",
                                "Criar Eventos",
                                "Criar Encartes",
                                "Agendar Salas",
                                "Agendar Carros",
                                "Visualizar Relatório DRE",
                                "Alterar ramal de usuários",
                                "Gerenciar produtos da loja"
                              ]
                                .filter(permission => 
                                  permission.toLowerCase().includes(permissionSearch.toLowerCase())
                                )
                                .slice(0, 5)
                                .map((suggestion, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    className="w-full px-3 py-2 text-left hover:bg-muted text-sm transition-colors"
                                    onClick={() => {
                                      setPermissionSearch(suggestion)
                                      setShowPermissionAutocomplete(false)
                                    }}
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              {[
                                "Criar Solicitações",
                                "Criar Eventos",
                                "Criar Encartes",
                                "Agendar Salas",
                                "Agendar Carros",
                                "Visualizar Relatório DRE",
                                "Alterar ramal de usuários",
                                "Gerenciar produtos da loja"
                              ].filter(permission => 
                                permission.toLowerCase().includes(permissionSearch.toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  Nenhuma sugestão encontrada
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Lista de permissões - mostra 4 itens, scrollável */}
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 border rounded-md p-2">
                          {[
                            {
                              id: "create_form",
                              label: "Criar Solicitações",
                              checked: permissionsData.can_create_form,
                              onChange: (checked: boolean) => {
                                setPermissionsData({
                                  ...permissionsData,
                                  can_create_form: checked
                                });
                              }
                            },
                            {
                              id: "create_event",
                              label: "Criar Eventos",
                              checked: permissionsData.can_create_event,
                              onChange: (checked: boolean) => {
                                setPermissionsData({
                                  ...permissionsData,
                                  can_create_event: checked
                                });
                              }
                            },
                            {
                              id: "create_flyer",
                              label: "Criar Encartes",
                              checked: permissionsData.can_create_flyer,
                              onChange: (checked: boolean) => {
                                setPermissionsData({
                                  ...permissionsData,
                                  can_create_flyer: checked
                                });
                              }
                            },
                            {
                              id: "create_booking",
                              label: "Agendar Salas",
                              checked: permissionsData.can_create_booking,
                              onChange: (checked: boolean) => {
                                setPermissionsData({
                                  ...permissionsData,
                                  can_create_booking: checked
                                });
                              }
                            },
                            {
                              id: "locate_cars",
                              label: "Agendar Carros",
                              checked: permissionsData.can_locate_cars,
                              onChange: (checked: boolean) => {
                                setPermissionsData({
                                  ...permissionsData,
                                  can_locate_cars: checked
                                });
                              }
                            },
                            {
                              id: "view_dre_report",
                              label: "Visualizar Relatório DRE",
                              checked: permissionsData.can_view_dre_report,
                              onChange: (checked: boolean) => {
                                setPermissionsData({
                                  ...permissionsData,
                                  can_view_dre_report: checked,
                                  admin_pages: checked
                                    ? [...(permissionsData.admin_pages || []), "/admin", "/admin/food"]
                                      .filter((page, index, arr) => arr.indexOf(page) === index)
                                    : permissionsData.admin_pages || []
                                });
                              }
                            },
                            {
                              id: "manage_extensions",
                              label: "Alterar ramal de usuários",
                              checked: permissionsData.can_manage_extensions,
                              onChange: (checked: boolean) => {
                                setPermissionsData({
                                  ...permissionsData,
                                  can_manage_extensions: checked
                                });
                              }
                            },
                            {
                              id: "manage_produtos",
                              label: "Gerenciar produtos da loja",
                              checked: permissionsData.can_manage_produtos,
                              onChange: (checked: boolean) => {
                                setPermissionsData({
                                  ...permissionsData,
                                  can_manage_produtos: checked
                                });
                              }
                            }
                          ]
                            .filter(permission => 
                              !permissionSearch || 
                              permission.label.toLowerCase().includes(permissionSearch.toLowerCase())
                            )
                            .map((permission) => (
                              <div 
                                key={permission.id}
                                className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                              >
                                <Checkbox
                                  id={permission.id}
                                  checked={permission.checked}
                                  onCheckedChange={(checked) => permission.onChange(checked === true)}
                                />
                                <Label htmlFor={permission.id} className="cursor-pointer flex-1">
                                  {permission.label}
                                </Label>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSavePermissions} disabled={updateRoleConfig.isPending}>
                      {updateRoleConfig.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Permissões
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo de Usuário</Label>
                    <p className="text-sm font-medium mt-1">
                      {permissionsData.sudo ? "Super Admin (Acesso Total)" : 
                       permissionsData.isTotem ? "Usuário TOTEM (Acesso Limitado)" :
                       "Usuário Padrão (Pode visualizar tudo)"}
                    </p>
                  </div>
                  
                  {!permissionsData.sudo && !permissionsData.isTotem && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Permissões de Criação</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {permissionsData.can_create_form && (
                          <Badge variant="secondary">Criar Solicitações</Badge>
                        )}
                        {permissionsData.can_create_event && (
                          <Badge variant="secondary">Criar Eventos</Badge>
                        )}
                        {permissionsData.can_create_flyer && (
                          <Badge variant="secondary">Criar Encartes</Badge>
                        )}
                        {permissionsData.can_create_booking && (
                          <Badge variant="secondary">Agendar Salas</Badge>
                        )}
                        {permissionsData.can_locate_cars && (
                          <Badge variant="secondary">Agendar Carros</Badge>
                        )}
                        {permissionsData.can_view_dre_report && (
                          <Badge variant="secondary">Visualizar DRE</Badge>
                        )}
                        {permissionsData.can_manage_extensions && (
                          <Badge variant="secondary">Alterar Ramais</Badge>
                        )}
                        {permissionsData.can_manage_produtos && (
                          <Badge variant="secondary">Gerenciar Produtos</Badge>
                        )}
                        {!permissionsData.can_create_form &&
                         !permissionsData.can_create_event &&
                         !permissionsData.can_create_flyer &&
                         !permissionsData.can_create_booking &&
                         !permissionsData.can_locate_cars &&
                         !permissionsData.can_view_dre_report &&
                         !permissionsData.can_manage_extensions &&
                         !permissionsData.can_manage_produtos && (
                          <span className="text-sm text-muted-foreground">Apenas visualização</span>
                        )}
                      </div>
                    </div>
                  )}

                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Permissões
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          {/* Tab: Rotas Admin */}
          {!canEditBasicOnly && !permissionsData.isTotem && (
            <TabsContent value="routes" className="mt-4 space-y-4">
              {isEditing ? (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div>
                    <Label className="text-sm font-semibold">Configurar Acesso às Páginas Admin</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione quais páginas administrativas o usuário pode acessar. 
                      <strong> /admin é obrigatório para acessar qualquer outra página.</strong>
                    </p>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {ADMIN_ROUTES.map((route) => {
                      const hasAccess = adminRoutesData.includes(route.id)
                      const isDisabled = route.id !== "/admin" && route.requiresBasicAdmin && !adminRoutesData.includes("/admin")
                      const IconComponent = route.icon

                      return (
                        <div 
                          key={route.id} 
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                            isDisabled ? 'opacity-50 bg-muted/30' : hasAccess ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            id={`route_${route.id}`}
                            checked={hasAccess}
                            disabled={isDisabled}
                            onCheckedChange={() => handleToggleAdminRoute(route.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-muted-foreground" />
                              <Label 
                                htmlFor={`route_${route.id}`} 
                                className={`font-medium cursor-pointer ${isDisabled ? 'text-muted-foreground' : ''}`}
                              >
                                {route.title}
                              </Label>
                              {route.id === "/admin" && (
                                <Badge variant="outline" className="text-xs">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                            <p className={`text-xs ${isDisabled ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                              {route.description}
                            </p>
                            <p className={`text-xs font-mono ${isDisabled ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                              {route.path}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false)
                        setAdminRoutesData((user.role_config as ExtendedRolesConfig)?.admin_pages || [])
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveAdminRoutes} disabled={updateRoleConfig.isPending}>
                      {updateRoleConfig.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Rotas
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Rotas Admin Permitidas</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {adminRoutesData.length > 0 ? (
                        adminRoutesData.map((routeId) => {
                          const route = ADMIN_ROUTES.find(r => r.id === routeId)
                          if (!route) return null
                          const IconComponent = route.icon
                          
                          return (
                            <Badge key={routeId} variant="secondary" className="flex items-center gap-1">
                              <IconComponent className="h-3 w-3" />
                              {route.title}
                            </Badge>
                          )
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground">Nenhum acesso admin</span>
                      )}
                    </div>
                  </div>

                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Rotas Admin
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          {/* Tab: Visibilidade de Solicitações */}
          {!canEditBasicOnly && !permissionsData.sudo && !permissionsData.isTotem && (
            <TabsContent value="forms" className="mt-4 space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="mb-4">
                  <Label className="text-sm font-semibold">Controle de Solicitações</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por padrão, todos os usuários podem ver todas as solicitações. Use as opções abaixo para restringir acesso.
                  </p>
                </div>

                {/* Barra de pesquisa com autocomplete */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Buscar solicitação..."
                    value={formSearch}
                    onChange={(e) => {
                      setFormSearch(e.target.value)
                      setShowFormAutocomplete(e.target.value.length > 0)
                    }}
                    onFocus={() => setShowFormAutocomplete(formSearch.length > 0)}
                    onBlur={() => setTimeout(() => setShowFormAutocomplete(false), 200)}
                    className="pl-10"
                  />
                  {formSearch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 z-10"
                      onClick={() => {
                        setFormSearch("")
                        setShowFormAutocomplete(false)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Autocomplete */}
                  {showFormAutocomplete && formSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                      {allForms
                        .filter(form => 
                          form.title.toLowerCase().includes(formSearch.toLowerCase())
                        )
                        .slice(0, 5)
                        .map((form) => (
                          <button
                            key={form.id}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-muted text-sm transition-colors"
                            onClick={() => {
                              setFormSearch(form.title)
                              setShowFormAutocomplete(false)
                            }}
                          >
                            {form.title}
                          </button>
                        ))}
                      {allForms.filter(form => 
                        form.title.toLowerCase().includes(formSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Nenhuma solicitação encontrada
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-md p-2">
                  {allForms
                    .filter(form => 
                      !formSearch || 
                      form.title.toLowerCase().includes(formSearch.toLowerCase())
                    )
                    .map((form) => {
                    const isHidden = (user.role_config as ExtendedRolesConfig)?.hidden_forms?.includes(form.id) ?? false
                    const isInVisibleList = (user.role_config as ExtendedRolesConfig)?.visible_forms?.includes(form.id) ?? false
                    const hasRestrictiveList = ((user.role_config as ExtendedRolesConfig)?.visible_forms?.length ?? 0) > 0

                    let status = "Visível"
                    let statusColor = "text-green-600"
                    if (isHidden) {
                      status = "Oculto"
                      statusColor = "text-red-600"
                    } else if (hasRestrictiveList && !isInVisibleList) {
                      status = "Restrito"
                      statusColor = "text-yellow-600"
                    }

                    return (
                      <div key={form.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{form.title}</div>
                          <div className={`text-xs font-medium ${statusColor}`}>Status: {status}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {status !== "Visível" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleFormVisibility(form.id, 'show')}
                              disabled={updateFormVisibility.isPending}
                            >
                              Mostrar
                            </Button>
                          )}
                          {status === "Visível" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleFormVisibility(form.id, 'hide')}
                              disabled={updateFormVisibility.isPending}
                            >
                              Ocultar
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {((user.role_config as ExtendedRolesConfig)?.hidden_forms?.length ?? 0) > 0 && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="text-sm font-medium text-red-800 dark:text-red-400">
                      Solicitações Ocultas: {(user.role_config as ExtendedRolesConfig)?.hidden_forms?.length}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-500">
                      Este usuário não pode ver {(user.role_config as ExtendedRolesConfig)?.hidden_forms?.length} formulário(s)
                    </div>
                  </div>
                )}

                {((user.role_config as ExtendedRolesConfig)?.visible_forms?.length ?? 0) > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-400">
                      Lista Restritiva Ativa: {(user.role_config as ExtendedRolesConfig)?.visible_forms?.length} solicitação(ões)
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-500">
                      Este usuário só pode ver solicitações específicas da lista
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}