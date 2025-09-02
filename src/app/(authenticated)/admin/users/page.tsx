"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import { Users, Search, Settings, Shield } from "lucide-react"
import type { RolesConfig } from "@/types/role-config"

export default function UsersConfigPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { isSudo } = useAccessControl()

  const { data: users, isLoading } = api.user.listUsers.useQuery({
    sector: searchTerm || undefined,
  })

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
          <h2 className="text-2xl font-bold tracking-tight">Configuração de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie permissões e configurações de usuários por setor
          </p>
        </div>

        {/* Campo de busca por setor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar por Setor
            </CardTitle>
            <CardDescription>
              Digite o nome do setor para filtrar usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="sector">Setor</Label>
                <Input
                  id="sector"
                  placeholder="Digite o setor (ex: TI, RH, Marketing)"
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
              Usuários Encontrados
            </CardTitle>
            <CardDescription>
              {users ? `${users.length} usuário(s) encontrado(s)` : "Busque por um setor para ver os usuários"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Buscando usuários...</p>
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => (
                  <UserCard key={user.id} user={{
                    ...user,
                    role_config: user.role_config as RolesConfig
                  }} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhum usuário encontrado para este setor." : "Digite um setor para buscar usuários."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

interface UserCardProps {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    setor: string | null
    role_config: RolesConfig
  }
}

function UserCard({ user }: UserCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  // Buscar formulários disponíveis
  const { data: allForms } = api.form.list.useQuery()

  const updateRoleConfig = api.user.updateRoleConfig.useMutation({
    onSuccess: () => {
      toast({
        title: "Permissões atualizadas",
        description: "As permissões do usuário foram atualizadas com sucesso.",
      })
      setIsEditing(false)
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const getAccessibleRoutes = (roleConfig: RolesConfig): string[] => {
    if (!roleConfig) return []

    const routes: string[] = []

    // Sempre pode acessar dashboard
    routes.push("Dashboard")

    // Verifica páginas admin
    if (roleConfig.admin_pages) {
      if (roleConfig.admin_pages.includes("/admin")) {
        routes.push("Admin")
      }
      if (roleConfig.admin_pages.includes("/food")) {
        routes.push("Admin - Almoços")
      }
      if (roleConfig.admin_pages.includes("/rooms")) {
        routes.push("Admin - Salas")
      }
      if (roleConfig.admin_pages.includes("/ideas")) {
        routes.push("Admin - Ideias")
      }
    }

    // Sempre pode acessar eventos, flyers, rooms
    routes.push("Eventos", "Encartes", "Salas")

    // Verifica permissões de formulários
    if (roleConfig.forms?.can_create_form) {
      routes.push("Criar Formulários")
    }

    // Verifica permissões de conteúdo
    if (roleConfig.content) {
      if (roleConfig.content.can_create_event) {
        routes.push("Criar Eventos")
      }
      if (roleConfig.content.can_create_flyer) {
        routes.push("Criar Encartes")
      }
      if (roleConfig.content.can_create_booking) {
        routes.push("Agendar Salas")
      }
    }

    return routes
  }

  const handleSavePermissions = (newPermissions: RolesConfig) => {
    updateRoleConfig.mutate({
      userId: user.id,
      roleConfig: newPermissions,
    })
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isEditing ? "Cancelar" : "Editar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Rotas Acessíveis:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {getAccessibleRoutes(user.role_config).map((route, index) => (
                <Badge key={index} variant="secondary">
                  {route}
                </Badge>
              ))}
            </div>
          </div>

          {isEditing && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-3 block">Editar Permissões:</Label>
              <UserPermissionsEditor
                currentConfig={user.role_config}
                allForms={allForms ?? []}
                onSave={handleSavePermissions}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface UserPermissionsEditorProps {
  currentConfig: RolesConfig
  allForms: { id: string; title: string }[]
  onSave: (config: RolesConfig) => void
  onCancel: () => void
}

function UserPermissionsEditor({ currentConfig, allForms, onSave, onCancel }: UserPermissionsEditorProps) {
  const [config, setConfig] = useState(currentConfig || {} as RolesConfig)

  // Remove the local query since we're receiving allForms as a prop

  const handleSave = () => {
    onSave(config)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Permissões de Conteúdo</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create_event"
                checked={config.content?.can_create_event ?? false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    content: {
                      can_create_event: e.target.checked,
                      can_create_flyer: config.content?.can_create_flyer ?? false,
                      can_create_booking: config.content?.can_create_booking ?? false,
                    },
                  })
                }
              />
              <Label htmlFor="create_event">Criar Eventos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create_flyer"
                checked={config.content?.can_create_flyer ?? false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    content: {
                      can_create_event: config.content?.can_create_event ?? false,
                      can_create_flyer: e.target.checked,
                      can_create_booking: config.content?.can_create_booking ?? false,
                    },
                  })
                }
              />
              <Label htmlFor="create_flyer">Criar Encartes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create_booking"
                checked={config.content?.can_create_booking ?? false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    content: {
                      can_create_event: config.content?.can_create_event ?? false,
                      can_create_flyer: config.content?.can_create_flyer ?? false,
                      can_create_booking: e.target.checked,
                    },
                  })
                }
              />
              <Label htmlFor="create_booking">Agendar Salas</Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Permissões de Formulários</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create_form"
                checked={config.forms?.can_create_form ?? false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    forms: {
                      can_create_form: e.target.checked,
                      unlocked_forms: config.forms?.unlocked_forms ?? [],
                      hidden_forms: config.forms?.hidden_forms ?? [],
                    },
                  })
                }
              />
              <Label htmlFor="create_form">Criar Formulários</Label>
            </div>
          </div>

          <Label className="text-sm font-medium">Formulários Ocultos</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
            {allForms.map((form) => (
              <div key={form.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`hidden_${form.id}`}
                  checked={config.forms?.hidden_forms?.includes(form.id) ?? false}
                  onChange={(e) => {
                    const currentHidden = config.forms?.hidden_forms ?? [];
                    const newHidden = e.target.checked
                      ? [...currentHidden, form.id]
                      : currentHidden.filter(id => id !== form.id);

                    setConfig({
                      ...config,
                      forms: {
                        can_create_form: config.forms?.can_create_form ?? false,
                        unlocked_forms: config.forms?.unlocked_forms ?? [],
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
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={false}>
          Salvar
        </Button>
      </div>
    </div>
  )
}
