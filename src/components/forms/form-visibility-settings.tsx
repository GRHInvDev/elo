"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Users, ChevronDown, Lock, Globe } from "lucide-react"
import { UserSearch } from "@/components/forms/user-search"

export interface FormVisibilityUserOption {
  id: string
  name: string | null
  email: string
  setor: string | null
}

interface FormVisibilitySettingsProps {
  isPrivate: boolean
  onIsPrivateChange: (value: boolean) => void
  allowedUsers: string[]
  onAllowedUsersChange: (ids: string[]) => void
  allowedSectors: string[]
  onAllowedSectorsChange: (sectors: string[]) => void
  usersForVisibility: FormVisibilityUserOption[]
}

export function FormVisibilitySettings({
  isPrivate,
  onIsPrivateChange,
  allowedUsers,
  onAllowedUsersChange,
  allowedSectors,
  onAllowedSectorsChange,
  usersForVisibility,
}: FormVisibilitySettingsProps) {
  const userSearchItems = usersForVisibility.map((user) => ({
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    setor: user.setor,
  }))

  const uniqueSectors = [...new Set(usersForVisibility.map((u) => u.setor).filter(Boolean))].sort() as string[]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPrivate ? <Lock className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
          Quem pode ver este formulário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Formulários públicos aparecem para todos (exceto perfis restritos). Formulários privados ficam visíveis
          apenas para o criador, responsáveis, colaboradores e setores que você indicar abaixo.
        </p>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPrivate"
            checked={isPrivate}
            onCheckedChange={(checked) => {
              onIsPrivateChange(checked === true)
              if (!checked) {
                onAllowedUsersChange([])
                onAllowedSectorsChange([])
              }
            }}
          />
          <Label htmlFor="isPrivate" className="font-medium">
            Formulário privado
          </Label>
        </div>

        {!isPrivate && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
            <Globe className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-200">
              Visível na lista de formulários para todos os colaboradores com acesso à intranet.
            </span>
          </div>
        )}

        {isPrivate && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Configurar acesso por pessoa e setor
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="space-y-6 rounded-lg border p-4">
                <UserSearch
                  users={userSearchItems}
                  selectedUsers={allowedUsers}
                  onSelectionChange={onAllowedUsersChange}
                  placeholder="Buscar colaboradores por nome, email ou setor..."
                  maxHeight="300px"
                />

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Setores com acesso</Label>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Marque setores inteiros para liberar todos os colaboradores daquele setor.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {uniqueSectors.map((sector) => (
                      <div key={sector} className="flex items-center space-x-2 rounded-lg border bg-muted/20 p-2">
                        <Checkbox
                          id={`sector_${sector}`}
                          checked={allowedSectors.includes(sector)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              onAllowedSectorsChange([...allowedSectors, sector])
                            } else {
                              onAllowedSectorsChange(allowedSectors.filter((s) => s !== sector))
                            }
                          }}
                        />
                        <Label htmlFor={`sector_${sector}`} className="text-sm font-medium">
                          {sector}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {allowedSectors.length > 0 && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                      <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Setores selecionados ({allowedSectors.length})
                      </Label>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {allowedSectors.map((sector) => (
                          <Badge key={sector} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {(allowedUsers.length > 0 || allowedSectors.length > 0) && (
                  <div className="border-t pt-4">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
                      <Label className="text-sm font-medium text-green-800 dark:text-green-200">Resumo do acesso</Label>
                      <div className="mt-1 space-y-1 text-sm text-green-700 dark:text-green-300">
                        <div>
                          <strong>Criador e responsáveis:</strong> sempre têm acesso
                        </div>
                        {allowedUsers.length > 0 && (
                          <div>
                            <strong>Colaboradores indicados:</strong> {allowedUsers.length}
                          </div>
                        )}
                        {allowedSectors.length > 0 && (
                          <div>
                            <strong>Setores:</strong> {allowedSectors.join(", ")}
                          </div>
                        )}
                        <p className="mt-2 text-xs italic text-green-600 dark:text-green-400">
                          Demais usuários não verão este formulário na lista.
                        </p>
                      </div>
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
