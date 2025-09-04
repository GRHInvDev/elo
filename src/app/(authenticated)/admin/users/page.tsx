"use client"

import { useState, useMemo } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
  ChevronDown, 
  X,
  Save
} from "lucide-react"
import type { RolesConfig } from "@/types/role-config"
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


export default function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const { isSudo, hasAdminAccess } = useAccessControl()

  // Verificar se tem acesso à página de usuários
  const hasAccess = isSudo || hasAdminAccess("/admin/users")

  const { data: users, isLoading, refetch } = api.user.listUsers.useQuery({
    search: searchTerm || undefined,
  })

  const { data: allForms } = api.form.list.useQuery()

  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter(user => 
      !searchTerm ||
      !!user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      !!user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.setor?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

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

        {/* Campo de busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Usuários
            </CardTitle>
            <CardDescription>
              Digite o nome, email ou setor para filtrar usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Busca</Label>
                <Input
                  id="search"
                  placeholder="Digite o nome, email ou setor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              {isLoading ? "Carregando usuários..." : `${filteredUsers.length} usuário(s) encontrado(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Carregando usuários...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhum usuário encontrado para este filtro." : "Nenhum usuário encontrado."}
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
    role_config: RolesConfig
  }
  allForms: { id: string; title: string }[]
  onUserUpdate: () => void
}

function UserManagementCard({ user, allForms, onUserUpdate }: UserManagementCardProps) {
  const [isEditingBasic, setIsEditingBasic] = useState(false)
  const [isEditingPermissions, setIsEditingPermissions] = useState(false)
  const [isEditingAdminRoutes, setIsEditingAdminRoutes] = useState(false)
  
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
  })
  const [permissionsData, setPermissionsData] = useState<RolesConfig>(
    {
      sudo: user.role_config?.sudo ?? false,
      admin_pages: user.role_config?.admin_pages ?? [],
      can_create_form: user.role_config?.can_create_form ?? false,
      can_create_event: user.role_config?.can_create_event ?? false,
      can_create_flyer: user.role_config?.can_create_flyer ?? false,
      can_create_booking: user.role_config?.can_create_booking ?? false,
      can_locate_cars: user.role_config?.can_locate_cars ?? false,
      isTotem: user.role_config?.isTotem ?? false,
      visible_forms: user.role_config?.visible_forms,
      hidden_forms: user.role_config?.hidden_forms,
    }
  )
  const [adminRoutesData, setAdminRoutesData] = useState<string[]>(
    user.role_config?.admin_pages || []
  )

  const { toast } = useToast()
  
  const updateBasicInfo = api.user.updateBasicInfo.useMutation({
    onSuccess: () => {
      toast({
        title: "Dados atualizados",
        description: "Os dados básicos do usuário foram atualizados com sucesso.",
      })
      setIsEditingBasic(false)
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
      setIsEditingPermissions(false)
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
        description: "A visibilidade dos formulários foi atualizada com sucesso.",
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
        isTotem: permissionsData.isTotem ?? false,
        visible_forms: permissionsData.visible_forms,
        hidden_forms: permissionsData.hidden_forms,
      },
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
        isTotem: permissionsData.isTotem ?? false,
        visible_forms: permissionsData.visible_forms,
        hidden_forms: permissionsData.hidden_forms,
      },
    })
  }

  const handleToggleAdminRoute = (routeId: string) => {
    if (adminRoutesData.includes(routeId)) {
      // Se está removendo /admin, remover todas as outras rotas também
      if (routeId === "/admin") {
        setAdminRoutesData([])
      } else {
        setAdminRoutesData(prev => prev.filter(id => id !== routeId))
      }
    } else {
      // Se está adicionando uma rota que não seja /admin, garantir que /admin esteja incluído
      if (routeId !== "/admin" && !adminRoutesData.includes("/admin")) {
        setAdminRoutesData(prev => ["/admin", ...prev, routeId])
      } else {
        setAdminRoutesData(prev => [...prev, routeId])
      }
    }
  }

  // SISTEMA SIMPLIFICADO: Funções de gerenciamento removidas
  // Todos podem visualizar, apenas alguns podem criar

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {user.firstName} {user.lastName}
            </CardTitle>
            <CardDescription>
              {user.email}
              {user.setor && <span className="ml-2">• {getSetorLabel(user.setor)}</span>}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {user.role_config?.sudo && (
              <Badge variant="default" className="bg-red-100 text-red-800">
                SUPER ADMIN
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Seção de Dados Básicos */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Editar Dados Básicos
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {isEditingBasic ? (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditingBasic(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveBasicInfo} disabled={updateBasicInfo.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateBasicInfo.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Nome Completo</Label>
                    <p className="text-sm text-muted-foreground">{user.firstName} {user.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Setor</Label>
                    <p className="text-sm text-muted-foreground">{getSetorLabel(user.setor)}</p>
                  </div>
                </div>
                <Button onClick={() => setIsEditingBasic(true)} size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Seção de Permissões Avançadas */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Permissões Avançadas
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {isEditingPermissions ? (
              <div className="space-y-6 p-4 border rounded-lg">
                
                {/* Seção de Admin */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4" />
                    <Label className="text-base font-semibold">Administração</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure se o usuário é administrador do sistema.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 bg-red-50 rounded">
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
                      <Label htmlFor="sudo" className="font-medium text-red-700">
                        Super Admin (Acesso Total)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
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
                      <Label htmlFor="isTotem" className="font-medium text-yellow-700">
                        Usuário TOTEM (Acesso Limitado)
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção de Permissões de Criação */}
                {!permissionsData.sudo && !permissionsData.isTotem && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="h-4 w-4" />
                      <Label className="text-base font-semibold">Permissões de Criação</Label>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      SISTEMA SIMPLIFICADO: Todos podem visualizar, apenas configure quem pode criar.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="create_form"
                            checked={permissionsData.can_create_form}
                            onCheckedChange={(checked) => {
                              setPermissionsData({
                                ...permissionsData,
                                can_create_form: checked === true
                              });
                            }}
                          />
                          <Label htmlFor="create_form">Criar Formulários</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="create_event"
                            checked={permissionsData.can_create_event}
                            onCheckedChange={(checked) => {
                              setPermissionsData({
                                ...permissionsData,
                                can_create_event: checked === true
                              });
                            }}
                          />
                          <Label htmlFor="create_event">Criar Eventos</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="create_flyer"
                            checked={permissionsData.can_create_flyer}
                            onCheckedChange={(checked) => {
                              setPermissionsData({
                                ...permissionsData,
                                can_create_flyer: checked === true
                              });
                            }}
                          />
                          <Label htmlFor="create_flyer">Criar Encartes</Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="create_booking"
                            checked={permissionsData.can_create_booking}
                            onCheckedChange={(checked) => {
                              setPermissionsData({
                                ...permissionsData,
                                can_create_booking: checked === true
                              });
                            }}
                          />
                          <Label htmlFor="create_booking">Agendar Salas</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="locate_cars"
                            checked={permissionsData.can_locate_cars}
                            onCheckedChange={(checked) => {
                              setPermissionsData({
                                ...permissionsData,
                                can_locate_cars: checked === true
                              });
                            }}
                          />
                          <Label htmlFor="locate_cars">Agendar Carros</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditingPermissions(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePermissions} disabled={updateRoleConfig.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateRoleConfig.isPending ? "Salvando..." : "Salvar Permissões"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg space-y-4">
                <div>
                  <Label className="text-sm font-medium">Tipo de Usuário</Label>
                  <p className="text-sm text-muted-foreground">
                    {permissionsData.sudo ? "Super Admin (Acesso Total)" : 
                     permissionsData.isTotem ? "Usuário TOTEM (Acesso Limitado)" :
                     "Usuário Padrão (Pode visualizar tudo)"}
                  </p>
                </div>
                
                {!permissionsData.sudo && !permissionsData.isTotem && (
                  <div>
                    <Label className="text-sm font-medium">Permissões de Criação</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {permissionsData.can_create_form && (
                        <Badge variant="secondary">Criar Formulários</Badge>
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
                      {!permissionsData.can_create_form && 
                       !permissionsData.can_create_event && 
                       !permissionsData.can_create_flyer && 
                       !permissionsData.can_create_booking && 
                       !permissionsData.can_locate_cars && (
                        <span className="text-sm text-muted-foreground">Apenas visualização</span>
                      )}
                    </div>
                  </div>
                )}

                <Button onClick={() => setIsEditingPermissions(true)} size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Editar Permissões
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Seção de Rotas Admin */}
        {!permissionsData.isTotem && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Acesso a Rotas Admin
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              {isEditingAdminRoutes ? (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Configurar Acesso às Páginas Admin</Label>
                    <p className="text-xs text-muted-foreground">
                      Selecione quais páginas administrativas o usuário pode acessar. 
                      <strong> /admin é obrigatório para acessar qualquer outra página.</strong>
                    </p>
                  </div>

                  <div className="space-y-3">
                    {ADMIN_ROUTES.map((route) => {
                      const hasAccess = adminRoutesData.includes(route.id)
                      const isDisabled = route.requiresBasicAdmin && !adminRoutesData.includes("/admin")
                      const IconComponent = route.icon

                      return (
                        <div 
                          key={route.id} 
                          className={`flex items-start space-x-3 p-3 border rounded-lg ${
                            isDisabled ? 'opacity-50 bg-gray-50' : ''
                          }`}
                        >
                          <Checkbox
                            id={`route_${route.id}`}
                            checked={hasAccess}
                            disabled={isDisabled}
                            onCheckedChange={() => handleToggleAdminRoute(route.id)}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <Label 
                                htmlFor={`route_${route.id}`} 
                                className={`font-medium ${isDisabled ? 'text-gray-500' : ''}`}
                              >
                                {route.title}
                              </Label>
                              {route.id === "/admin" && (
                                <Badge variant="outline" className="text-xs">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                            <p className={`text-xs ${isDisabled ? 'text-gray-400' : 'text-muted-foreground'}`}>
                              {route.description}
                            </p>
                            <p className={`text-xs font-mono ${isDisabled ? 'text-gray-400' : 'text-muted-foreground'}`}>
                              {route.path}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingAdminRoutes(false)
                        setAdminRoutesData(user.role_config?.admin_pages || [])
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveAdminRoutes} 
                      disabled={updateRoleConfig.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateRoleConfig.isPending ? "Salvando..." : "Salvar Rotas"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-lg space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Rotas Admin Permitidas</Label>
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

                  <Button onClick={() => setIsEditingAdminRoutes(true)} size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Rotas Admin
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        <Separator />

        {/* Seção de Visibilidade de Formulários */}
        {!permissionsData.sudo && !permissionsData.isTotem && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Visibilidade de Formulários
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="p-4 border rounded-lg">
                <div className="mb-4">
                  <Label className="text-sm font-medium">Controle de Formulários</Label>
                  <p className="text-xs text-muted-foreground">
                    Por padrão, todos os usuários podem ver todos os formulários. Use as opções abaixo para restringir acesso.
                  </p>
                </div>

                <div className="space-y-3">
                  {allForms.map((form) => {
                    const isHidden = user.role_config?.hidden_forms?.includes(form.id) ?? false
                    const isInVisibleList = user.role_config?.visible_forms?.includes(form.id) ?? false
                    const hasRestrictiveList = (user.role_config?.visible_forms?.length ?? 0) > 0

                    let status = "Visível"
                    if (isHidden) {
                      status = "Oculto"
                    } else if (hasRestrictiveList && !isInVisibleList) {
                      status = "Restrito"
                    }

                    return (
                      <div key={form.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{form.title}</div>
                          <div className="text-xs text-muted-foreground">Status: {status}</div>
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

                {(user.role_config?.hidden_forms?.length ?? 0) > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm font-medium text-red-800">
                      Formulários Ocultos: {user.role_config?.hidden_forms?.length}
                    </div>
                    <div className="text-xs text-red-600">
                      Este usuário não pode ver {user.role_config?.hidden_forms?.length} formulário(s)
                    </div>
                  </div>
                )}

                {(user.role_config?.visible_forms?.length ?? 0) > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-800">
                      Lista Restritiva Ativa: {user.role_config?.visible_forms?.length} formulário(s)
                    </div>
                    <div className="text-xs text-blue-600">
                      Este usuário só pode ver formulários específicos da lista
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}