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

// SISTEMA SIMPLIFICADO: Todos podem visualizar, apenas alguns podem criar
// Removidas constantes não utilizadas

// Lista de setores disponíveis
const AVAILABLE_SETORES = [
  { value: "", label: "Nenhum setor" },
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

// Função auxiliar para obter o nome amigável do setor
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSetorLabel = (setorValue: string | null | undefined): string => {
  if (!setorValue) return "Não informado"
  const setor = AVAILABLE_SETORES.find(s => s.value === setorValue)
  return setor ? setor.label : setorValue
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

function UserManagementCard({ user, allForms: _allForms, onUserUpdate }: UserManagementCardProps) {
  const [isEditingBasic, setIsEditingBasic] = useState(false)
  const [isEditingPermissions, setIsEditingPermissions] = useState(false)
  
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
    setor: user.setor ?? "",
  })
  const [permissionsData, setPermissionsData] = useState<RolesConfig>(
    user.role_config || {
      sudo: false,
      admin_pages: [],
      can_create_form: false,
      can_create_event: false,
      can_create_flyer: false,
      can_create_booking: false,
      can_locate_cars: false,
      isTotem: false,
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
      </CardContent>
    </Card>
  )
}