"use client"

import { useState } from "react"
import { FormBuilder } from "@/components/forms/form-builder"
import type { Field } from "@/lib/form-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
}: FormBuilderWithSaveProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [fields, setFields] = useState<Field[]>(initialFields)
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate)
  const [allowedUsers, setAllowedUsers] = useState<string[]>(initialAllowedUsers)
  const [allowedSectors, setAllowedSectors] = useState<string[]>(initialAllowedSectors)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  // Buscar usuários e setores para o filtro
  const { data: usersAndSectors } = api.form.getUsersAndSectors.useQuery()

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
      })
    }
  }

  const isLoading = createForm.isPending || updateForm.isPending

  return (
    <div className="space-y-8">
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
                <div className="space-y-3 p-4 border rounded-lg">
                  <UserSearch
                    users={usersAndSectors?.users || []}
                    selectedUsers={allowedUsers}
                    onSelectionChange={setAllowedUsers}
                    placeholder="Buscar colaboradores..."
                    maxHeight="300px"
                  />

                  <div>
                    <Label className="text-sm font-medium">Setores</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Selecione setores inteiros que podem ver este formulário
                    </p>
                    <div className="space-y-2">
                      {usersAndSectors?.sectors.filter(Boolean).map((sector) => (
                        <div key={sector} className="flex items-center space-x-2">
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
                          <Label htmlFor={`sector_${sector}`} className="text-sm">
                            {sector}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(allowedUsers.length > 0 || allowedSectors.length > 0) && (
                    <div className="pt-2 border-t">
                      <Label className="text-sm font-medium">Resumo do Acesso:</Label>
                      <div className="text-xs text-muted-foreground mt-1">
                        {allowedUsers.length > 0 && (
                          <div>• {allowedUsers.length} usuário(s) específico(s)</div>
                        )}
                        {allowedSectors.length > 0 && (
                          <div>• {allowedSectors.length} setor(es): {allowedSectors.join(", ")}</div>
                        )}
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

