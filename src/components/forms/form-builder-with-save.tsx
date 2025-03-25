"use client"

import { useState } from "react"
import { FormBuilder } from "@/components/forms/form-builder"
import type { Field } from "@/lib/form-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FormBuilderWithSaveProps {
  mode: "create" | "edit"
  formId?: string
  initialTitle?: string
  initialDescription?: string
  initialFields?: Field[]
}

export function FormBuilderWithSave({
  mode,
  formId,
  initialTitle = "Novo Formulário",
  initialDescription = "",
  initialFields = [],
}: FormBuilderWithSaveProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [fields, setFields] = useState<Field[]>(initialFields)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

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
      })
    } else if (mode === "edit" && formId) {
      updateForm.mutate({
        id: formId,
        title,
        description: description || undefined,
        fields,
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

