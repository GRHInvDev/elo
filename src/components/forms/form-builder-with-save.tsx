"use client"

import { useState, useEffect, useRef } from "react"
import { FormBuilder } from "@/components/forms/form-builder"
import type { Field } from "@/lib/form-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UserSearch } from "@/components/forms/user-search"
import { FormVisibilitySettings } from "@/components/forms/form-visibility-settings"
import { FormSpreadsheetExportSettings } from "@/components/forms/form-spreadsheet-export-settings"

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
  initialSpreadsheetExportEnabled?: boolean
}

// Função auxiliar para comparar arrays de strings
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((val, index) => val === sortedB[index])
}

// Função auxiliar para comparar arrays de objetos (campos) usando JSON
function fieldsEqual(a: Field[], b: Field[]): boolean {
  if (a.length !== b.length) return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return a.every((fieldA, index) => {
      const fieldB = b[index]
      return fieldA?.id === fieldB?.id && 
             fieldA?.type === fieldB?.type &&
             fieldA?.label === fieldB?.label
    })
  }
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
  initialSpreadsheetExportEnabled = false,
}: FormBuilderWithSaveProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [fields, setFields] = useState<Field[]>(initialFields)
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate)
  const [allowedUsers, setAllowedUsers] = useState<string[]>(initialAllowedUsers)
  const [allowedSectors, setAllowedSectors] = useState<string[]>(initialAllowedSectors)
  const [ownerIds, setOwnerIds] = useState<string[]>(initialOwnerIds)
  const [spreadsheetExportEnabled, setSpreadsheetExportEnabled] = useState(initialSpreadsheetExportEnabled)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  
  // Usar refs para rastrear valores anteriores e evitar loops infinitos
  const prevInitialsRef = useRef({
    initialTitle,
    initialDescription,
    initialFields,
    initialIsPrivate,
    initialAllowedUsers,
    initialAllowedSectors,
    initialOwnerIds,
    initialSpreadsheetExportEnabled,
  })

  // Atualizar estado quando os props iniciais mudarem (especialmente ao editar)
  useEffect(() => {
    const prev = prevInitialsRef.current
    
    // Só atualizar se os valores realmente mudaram
    if (prev.initialTitle !== initialTitle) {
      setTitle(initialTitle)
    }
    if (prev.initialDescription !== initialDescription) {
      setDescription(initialDescription)
    }
    if (!fieldsEqual(prev.initialFields, initialFields)) {
      setFields(initialFields)
    }
    if (prev.initialIsPrivate !== initialIsPrivate) {
      setIsPrivate(initialIsPrivate)
    }
    if (!arraysEqual(prev.initialAllowedUsers, initialAllowedUsers)) {
      setAllowedUsers(initialAllowedUsers)
    }
    if (!arraysEqual(prev.initialAllowedSectors, initialAllowedSectors)) {
      setAllowedSectors(initialAllowedSectors)
    }
    if (!arraysEqual(prev.initialOwnerIds, initialOwnerIds)) {
      setOwnerIds(initialOwnerIds)
    }
    if (prev.initialSpreadsheetExportEnabled !== initialSpreadsheetExportEnabled) {
      setSpreadsheetExportEnabled(initialSpreadsheetExportEnabled)
    }
    
    // Atualizar refs
    prevInitialsRef.current = {
      initialTitle,
      initialDescription,
      initialFields,
      initialIsPrivate,
      initialAllowedUsers,
      initialAllowedSectors,
      initialOwnerIds,
      initialSpreadsheetExportEnabled,
    }
  }, [initialTitle, initialDescription, initialFields, initialIsPrivate, initialAllowedUsers, initialAllowedSectors, initialOwnerIds, initialSpreadsheetExportEnabled])

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
        spreadsheetExportEnabled,
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
        spreadsheetExportEnabled,
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

      <FormVisibilitySettings
        isPrivate={isPrivate}
        onIsPrivateChange={(v) => {
          setIsPrivate(v)
          if (!v) {
            setAllowedUsers([])
            setAllowedSectors([])
          }
        }}
        allowedUsers={allowedUsers}
        onAllowedUsersChange={setAllowedUsers}
        allowedSectors={allowedSectors}
        onAllowedSectorsChange={setAllowedSectors}
        usersForVisibility={
          usersAndSectors?.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email ?? "",
            setor: user.setor ?? null,
          })) ?? []
        }
      />

      <FormSpreadsheetExportSettings enabled={spreadsheetExportEnabled} onEnabledChange={setSpreadsheetExportEnabled} />

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

