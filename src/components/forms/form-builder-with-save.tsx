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
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UserSearch } from "@/components/forms/user-search"
import { FormVisibilitySettings } from "@/components/forms/form-visibility-settings"
import { FormSpreadsheetExportSettings } from "@/components/forms/form-spreadsheet-export-settings"
import { FormSectionCard } from "@/components/forms/form-section-card"

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
  return JSON.stringify(a) === JSON.stringify(b)
}

export function FormBuilderWithSave({
  mode,
  formId,
  initialTitle = "",
  initialDescription = "",
  initialFields = [],
  initialIsPrivate = false,
  initialAllowedUsers = [],
  initialAllowedSectors = [],
  initialOwnerIds = [],
  initialSpreadsheetExportEnabled = false,
}: FormBuilderWithSaveProps) {
  const { toast } = useToast()
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

  // Usar ref para rastrear os valores iniciais anteriores e evitar loops infinitos
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

  // Buscar usuários para o seletor de responsáveis e visibilidade
  const { data: allUsers = [] } = api.user.listAll.useQuery()

  const formattedUsers = (allUsers ?? []).map((u) => {
    const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
    return {
      id: u.id,
      name: fullName.length > 0 ? fullName : (u.email ?? ""),
      email: u.email ?? "",
      setor: u.setor ?? null,
    }
  })

  const utils = api.useUtils()

  const createForm = api.form.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Formulário criado com sucesso!",
      })
      void utils.form.list.invalidate()
      router.push(`/forms/${data.id}`)
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar formulário",
        description: error.message,
        variant: "destructive",
      })
      setError(error.message)
    },
  })

  const updateForm = api.form.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Formulário atualizado com sucesso!",
      })
      void utils.form.list.invalidate()
      void utils.form.getById.invalidate({ id: data.id })
      router.push(`/forms/${data.id}`)
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar formulário",
        description: error.message,
        variant: "destructive",
      })
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
      <FormSectionCard
        title="Responsáveis do Formulário"
        description="Adicione um ou mais responsáveis que poderão ver e interagir com todas as respostas deste formulário."
      >
        <div className="space-y-4">
          <UserSearch
            users={formattedUsers}
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
        </div>
      </FormSectionCard>

      <FormSectionCard title="Informações da solicitação" description="Preencha os campos abaixo com as informações da sua solicitação." >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs sm:text-sm font-semibold text-foreground">
              Título do Formulário
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do formulário"
              className="h-11 rounded-xl border-border/70 bg-background/60 text-sm font-semibold transition-all focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-foreground">
              Descrição (opcional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite uma descrição para o formulário"
              rows={3}
              className="rounded-xl border-border/70 bg-background/60 text-sm transition-all focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15"
            />
          </div>
        </div>
      </FormSectionCard>

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
        usersForVisibility={formattedUsers}
      />

      <FormSpreadsheetExportSettings enabled={spreadsheetExportEnabled} onEnabledChange={setSpreadsheetExportEnabled} />

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormBuilder fields={fields} setFields={setFields} />

      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => router.push("/forms")}
          disabled={isLoading}
          className="h-10 px-5 rounded-xl text-xs font-semibold"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="h-10 px-6 rounded-xl font-semibold shadow-xs hover:shadow-md transition-all gap-2 text-xs"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Criar Formulário" : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  )
}
