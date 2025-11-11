"use client"

import { useState, useEffect } from "react"
import { FormBuilder } from "@/components/forms/form-builder"
import type { Field } from "@/lib/form-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Users, ChevronDown, Lock, Globe } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UserSearch } from "@/components/forms/user-search"

interface FormBuilderWithSaveProps {
  mode: "create" | "edit"
  formId?: string
  initialTitle?: string
  initialDescription?: string
  initialFields?: Field[]
  initialIsPrivate?: boolean
  initialAllowedUsers?: string[]
  initialAllowedSectors?: string[]
  initialOwnerIds?: string[]
}

export function FormBuilderWithSave({
  mode,
  formId,
  initialTitle = "Novo Formulário",
  initialDescription = "",
  initialFields = [],
  initialIsPrivate = false,
  initialAllowedUsers = [],
  initialAllowedSectors = [],
  initialOwnerIds = [],
}: FormBuilderWithSaveProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [fields, setFields] = useState<Field[]>(initialFields)
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate)
  const [allowedUsers, setAllowedUsers] = useState<string[]>(initialAllowedUsers)
  const [allowedSectors, setAllowedSectors] = useState<string[]>(initialAllowedSectors)
  const [ownerIds, setOwnerIds] = useState<string[]>(initialOwnerIds)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  // Atualizar estado quando os props iniciais mudarem (especialmente ao editar)
  useEffect(() => {
    setTitle(initialTitle)
    setDescription(initialDescription)
    setFields(initialFields)
    setIsPrivate(initialIsPrivate)
    setAllowedUsers(initialAllowedUsers)
    setAllowedSectors(initialAllowedSectors)
    setOwnerIds(initialOwnerIds)
  }, [initialTitle, initialDescription, initialFields, initialIsPrivate, initialAllowedUsers, initialAllowedSectors, initialOwnerIds])

  // Buscar usuários e setores para o filtro
  const { data: usersAndSectors } = api.form.getUsersForFormVisibility.useQuery()

  const createForm = api.form.create.useMutation({
    onSuccess: (data) => {
      toast.success("Formulário criado com sucesso!")
      router.push(`/forms/${data.id}`)
    },
    onError: (error) => {
      toast.error(`Erro ao criar formulário: ${error.message}`)
      setError(error.message)
    },
  })

  const updateForm = api.form.update.useMutation({
    onSuccess: () => {
      toast.success("Formulário atualizado com sucesso!")
      router.push(`/forms/${formId}`)
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar formulário: ${error.message}`)
      setError(error.message)
    },
  })

  const handleSave = () => {
    if (!title.trim()) {
      setError("O título do formulário é obrigatório")
      return
    }

    if (fields.length === 0) {
      setError("Adicione pelo menos um campo ao formulário")
      return
    }

    setError(null)

    if (mode === "create") {
      createForm.mutate({
        title,
        description: description || undefined,
        fields,
        isPrivate,
        allowedUsers,
        allowedSectors,
        ownerIds,
      })
    } else if (mode === "edit" && formId) {
      updateForm.mutate({
        id: formId,
        title,
        description: description || undefined,
        fields,
        isPrivate,
        allowedUsers,
        allowedSectors,
        ownerIds,
      })
    }
  }

  const isLoading = createForm.isPending || updateForm.isPending

  return (
    <div className="space-y-8">
      {/* Seção de Responsáveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Responsáveis do Formulário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adicione um ou mais responsáveis que poderão ver e interagir com todas as respostas deste formulário.
          </p>
          <UserSearch
            users={usersAndSectors?.map(user => ({
              id: user.id,
              name: user.name,
              email: user.email,
              setor: user.setor,
            })) ?? []}
            selectedUsers={ownerIds}
            onSelectionChange={setOwnerIds}
            placeholder="Buscar responsáveis por nome, email ou setor..."
            maxHeight="300px"
          />
          {ownerIds.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {ownerIds.length} responsável(is) selecionado(s)
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Formulário</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título do formulário"
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Digite uma descrição para o formulário"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Visibilidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPrivate ? <Lock className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
            Configurações de Visibilidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPrivate"
              checked={isPrivate}
              onCheckedChange={(checked) => {
                setIsPrivate(checked === true)
                if (!checked) {
                  setAllowedUsers([])
                  setAllowedSectors([])
                }
              }}
            />
            <Label htmlFor="isPrivate" className="font-medium">
              Formulário Privado
            </Label>
          </div>
          
          {!isPrivate && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Globe className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                Este formulário será público e visível para todos os usuários.
              </span>
            </div>
          )}

          {isPrivate && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Configurar Acesso
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="space-y-6 p-4 border rounded-lg">
                  {/* Busca e seleção de usuários específicos */}
                  <UserSearch
                    users={usersAndSectors?.map(user => ({
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      setor: user.setor,
                    })) ?? []}
                    selectedUsers={allowedUsers}
                    onSelectionChange={setAllowedUsers}
                    placeholder="Buscar colaboradores por nome, email ou setor..."
                    maxHeight="300px"
                  />

                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium">Setores Completos</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Selecione setores inteiros para dar acesso a todos os funcionários do setor
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[...new Set(usersAndSectors?.map(user => user.setor).filter(Boolean))].sort().map((sector) => (
                        <div key={sector} className="flex items-center space-x-2 p-2 rounded-lg border bg-muted/20">
                          <Checkbox
                            id={`sector_${sector}`}
                            checked={allowedSectors.includes(sector!)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAllowedSectors([...allowedSectors, sector!])
                              } else {
                                setAllowedSectors(allowedSectors.filter(s => s !== sector))
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
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Label className="text-sm font-medium text-blue-800">
                          Setores com Acesso Total ({allowedSectors.length})
                        </Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {allowedSectors.map((sector) => (
                            <Badge key={sector} variant="secondary" className="bg-blue-100 text-blue-800">
                              {sector}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {(allowedUsers.length > 0 || allowedSectors.length > 0) && (
                    <div className="border-t pt-4">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <Label className="text-sm font-medium text-green-800">
                          📋 Resumo do Acesso
                        </Label>
                        <div className="text-sm text-green-700 mt-1 space-y-1">
                          <div>✅ <strong>Criador:</strong> Sempre tem acesso</div>
                          {allowedUsers.length > 0 && (
                            <div>👥 <strong>Usuários específicos:</strong> {allowedUsers.length} pessoa(s)</div>
                          )}
                          {allowedSectors.length > 0 && (
                            <div>🏢 <strong>Setores completos:</strong> {allowedSectors.join(", ")}</div>
                          )}
                          <div className="text-xs text-green-600 mt-2 italic">
                            Todos os outros usuários não verão este formulário
                          </div>
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormBuilder fields={fields} setFields={setFields} />

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/forms")} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Criar Formulário" : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  )
}

