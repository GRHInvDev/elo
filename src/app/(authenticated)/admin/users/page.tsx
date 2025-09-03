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
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import { 
  Users, 
  Search, 
  Settings, 
  Shield, 
  Edit3, 
  Route, 
  Key, 
  ChevronDown, 
  X,
  Info,
  FileText,

  Save
} from "lucide-react"
import type { RolesConfig } from "@/types/role-config"

// Definir todas as rotas disponíveis no sistema
const AVAILABLE_ROUTES = [
  { id: "dashboard", name: "Dashboard", description: "Página principal da intranet" },
  { id: "food", name: "Almoços", description: "Página para fazer pedidos de comida" },
  { id: "rooms", name: "Salas", description: "Página para reservar salas" },
  { id: "cars", name: "Carros", description: "Página para reservar carros" },
  { id: "events", name: "Eventos", description: "Página para visualizar e criar eventos" },
  { id: "flyers", name: "Encartes", description: "Página para visualizar e criar encartes" },
  { id: "shop", name: "Shop", description: "Página para comprar itens personalizados" },
  { id: "my-suggestions", name: "Minhas Ideias", description: "Visualizar suas ideias enviadas" },
  { id: "forms", name: "Formulários", description: "Página para processos internos" },
  { id: "admin", name: "Admin", description: "Página de administração" },
]

// Mapear rotas para suas permissões relacionadas
const ROUTE_PERMISSIONS_MAP: Record<string, string[]> = {
  "events": ["can_create_event"],
  "flyers": ["can_create_flyer"],
  "rooms": ["can_create_booking"],
  "cars": ["can_locate_cars"],
  "forms": ["can_create_form"],
}

export default function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const { isSudo } = useAccessControl()

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

  // Verificar se é sudo
  if (!isSudo) {
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
  const [basicData, setBasicData] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email,
    setor: user.setor ?? "",
  })
  const [permissionsData, setPermissionsData] = useState<RolesConfig>(
    user.role_config || {
      sudo: false,
      admin_pages: undefined,
      accessible_routes: undefined,
      forms: undefined,
      content: undefined,
    }
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

  const handleSaveBasicInfo = () => {
    updateBasicInfo.mutate({
      userId: user.id,
      ...basicData,
    })
  }

  const handleSavePermissions = () => {
    updateRoleConfig.mutate({
      userId: user.id,
      roleConfig: permissionsData,
    })
  }

  const handleRouteToggle = (routeId: string, checked: boolean) => {
    const currentRoutes = permissionsData.accessible_routes ?? []
    const newRoutes = checked
      ? [...currentRoutes, routeId]
      : currentRoutes.filter(r => r !== routeId)

    setPermissionsData({
      ...permissionsData,
      accessible_routes: newRoutes,
    })

    // Auto-selecionar permissões relacionadas se a rota for ativada
    if (checked && ROUTE_PERMISSIONS_MAP[routeId]) {
      const relatedPermissions = ROUTE_PERMISSIONS_MAP[routeId]
      const newContent = { 
        can_create_event: false,
        can_create_flyer: false,
        can_create_booking: false,
        can_locate_cars: false,
        ...permissionsData.content 
      }
      
      relatedPermissions.forEach((permission: string) => {
        if (permission in newContent) {
          (newContent as Record<string, boolean>)[permission] = true
        }
      })

      setPermissionsData({
        ...permissionsData,
        accessible_routes: newRoutes,
        content: newContent,
      })

      // Mostrar notificação
      toast({
        title: "Permissões relacionadas ativadas",
        description: `As permissões de ação relacionadas à rota ${AVAILABLE_ROUTES.find(r => r.id === routeId)?.name} foram ativadas automaticamente.`,
      })
    }
  }

  const getAccessibleRoutesText = () => {
    if (permissionsData.sudo) return "Super Admin (Acesso Total)"
    if (!permissionsData.accessible_routes?.length) return "Nenhuma rota específica"
    
    return permissionsData.accessible_routes
      .map(routeId => AVAILABLE_ROUTES.find(r => r.id === routeId)?.name)
      .filter(Boolean)
      .join(", ")
  }

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
              {user.setor && <span className="ml-2">• {user.setor}</span>}
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
                    <Input
                      id="setor"
                      value={basicData.setor}
                      onChange={(e) => setBasicData({ ...basicData, setor: e.target.value })}
                    />
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
                    <p className="text-sm text-muted-foreground">{user.setor ?? "Não informado"}</p>
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
                
                {/* Seção de Rotas */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Route className="h-4 w-4" />
                    <Label className="text-base font-semibold">Controle de Rotas</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione quais páginas este usuário pode acessar. Permissões relacionadas serão ativadas automaticamente.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                      <Checkbox
                        id="sudo"
                        checked={permissionsData.sudo}
                        onCheckedChange={(checked) => 
                          setPermissionsData({ ...permissionsData, sudo: checked === true })
                        }
                      />
                      <Label htmlFor="sudo" className="font-medium text-red-700">
                        Super Admin (Acesso Total)
                      </Label>
                    </div>
                    
                    {!permissionsData.sudo && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {AVAILABLE_ROUTES.map(route => (
                          <div key={route.id} className="flex items-start space-x-2 p-2 border rounded">
                            <Checkbox
                              id={`route_${route.id}`}
                              checked={permissionsData.accessible_routes?.includes(route.id) ?? false}
                              onCheckedChange={(checked) => handleRouteToggle(route.id, checked === true)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={`route_${route.id}`} className="font-medium">
                                {route.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">{route.description}</p>
                              {ROUTE_PERMISSIONS_MAP[route.id] && (
                                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                  <Info className="h-3 w-3" />
                                  Auto-ativa: {ROUTE_PERMISSIONS_MAP[route.id]!.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Seção de Permissões de Ação */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4" />
                    <Label className="text-base font-semibold">Permissões de Ação</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure as ações específicas que o usuário pode realizar em cada página.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Conteúdo</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="create_event"
                            checked={permissionsData.content?.can_create_event ?? false}
                            onCheckedChange={(checked) =>
                              setPermissionsData({
                                ...permissionsData,
                                content: {
                                  ...permissionsData.content,
                                  can_create_event: checked === true,
                                  can_create_flyer: permissionsData.content?.can_create_flyer ?? false,
                                  can_create_booking: permissionsData.content?.can_create_booking ?? false,
                                  can_locate_cars: permissionsData.content?.can_locate_cars ?? false,
                                },
                              })
                            }
                          />
                          <Label htmlFor="create_event">Criar Eventos</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="create_flyer"
                            checked={permissionsData.content?.can_create_flyer ?? false}
                            onCheckedChange={(checked) =>
                              setPermissionsData({
                                ...permissionsData,
                                content: {
                                  ...permissionsData.content,
                                  can_create_event: permissionsData.content?.can_create_event ?? false,
                                  can_create_flyer: checked === true,
                                  can_create_booking: permissionsData.content?.can_create_booking ?? false,
                                  can_locate_cars: permissionsData.content?.can_locate_cars ?? false,
                                },
                              })
                            }
                          />
                          <Label htmlFor="create_flyer">Criar Encartes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="create_booking"
                            checked={permissionsData.content?.can_create_booking ?? false}
                            onCheckedChange={(checked) =>
                              setPermissionsData({
                                ...permissionsData,
                                content: {
                                  ...permissionsData.content,
                                  can_create_event: permissionsData.content?.can_create_event ?? false,
                                  can_create_flyer: permissionsData.content?.can_create_flyer ?? false,
                                  can_create_booking: checked === true,
                                  can_locate_cars: permissionsData.content?.can_locate_cars ?? false,
                                },
                              })
                            }
                          />
                          <Label htmlFor="create_booking">Agendar Salas</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="locate_cars"
                            checked={permissionsData.content?.can_locate_cars ?? false}
                            onCheckedChange={(checked) =>
                              setPermissionsData({
                                ...permissionsData,
                                content: {
                                  ...permissionsData.content,
                                  can_create_event: permissionsData.content?.can_create_event ?? false,
                                  can_create_flyer: permissionsData.content?.can_create_flyer ?? false,
                                  can_create_booking: permissionsData.content?.can_create_booking ?? false,
                                  can_locate_cars: checked === true,
                                },
                              })
                            }
                          />
                          <Label htmlFor="locate_cars">Agendar Carros</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Formulários</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="create_form"
                            checked={permissionsData.forms?.can_create_form ?? false}
                            onCheckedChange={(checked) =>
                              setPermissionsData({
                                ...permissionsData,
                                forms: {
                                  ...permissionsData.forms,
                                  can_create_form: checked === true,
                                  unlocked_forms: permissionsData.forms?.unlocked_forms ?? [],
                                  hidden_forms: permissionsData.forms?.hidden_forms ?? [],
                                },
                              })
                            }
                          />
                          <Label htmlFor="create_form">Criar Formulários</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção de Visibilidade de Formulários */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4" />
                    <Label className="text-base font-semibold">Formulários Ocultos</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Por padrão, todos os formulários são visíveis. Selecione os formulários que devem ficar ocultos para este usuário.
                  </p>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                    {allForms.map((form) => (
                      <div key={form.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`hidden_${form.id}`}
                          checked={permissionsData.forms?.hidden_forms?.includes(form.id) ?? false}
                          onCheckedChange={(checked) => {
                            const currentHidden = permissionsData.forms?.hidden_forms ?? [];
                            const newHidden = checked
                              ? [...currentHidden, form.id]
                              : currentHidden.filter(id => id !== form.id);

                            setPermissionsData({
                              ...permissionsData,
                              forms: {
                                ...permissionsData.forms,
                                can_create_form: permissionsData.forms?.can_create_form ?? false,
                                unlocked_forms: permissionsData.forms?.unlocked_forms ?? [],
                                hidden_forms: newHidden,
                              },
                            });
                          }}
                        />
                        <Label htmlFor={`hidden_${form.id}`} className="text-sm">
                          {form.title}
                        </Label>
                      </div>
                    ))}
                    {allForms.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum formulário disponível</p>
                    )}
                  </div>
                </div>

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
                  <Label className="text-sm font-medium">Rotas Acessíveis</Label>
                  <p className="text-sm text-muted-foreground">{getAccessibleRoutesText()}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Permissões de Ação</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {permissionsData.content?.can_create_event && (
                      <Badge variant="secondary">Criar Eventos</Badge>
                    )}
                    {permissionsData.content?.can_create_flyer && (
                      <Badge variant="secondary">Criar Encartes</Badge>
                    )}
                    {permissionsData.content?.can_create_booking && (
                      <Badge variant="secondary">Agendar Salas</Badge>
                    )}
                    {permissionsData.content?.can_locate_cars && (
                      <Badge variant="secondary">Agendar Carros</Badge>
                    )}
                    {permissionsData.forms?.can_create_form && (
                      <Badge variant="secondary">Criar Formulários</Badge>
                    )}
                    {!permissionsData.content && !permissionsData.forms && (
                      <span className="text-sm text-muted-foreground">Nenhuma permissão específica</span>
                    )}
                  </div>
                </div>

                {permissionsData.forms?.hidden_forms && permissionsData.forms.hidden_forms.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Formulários Ocultos</Label>
                    <p className="text-sm text-muted-foreground">
                      {permissionsData.forms.hidden_forms.length} formulário(s) oculto(s)
                    </p>
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
      </CardContent>
    </Card>
  )
}