"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormResponseComponent } from "./form-response"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { Field } from "@/lib/form-types"
import type { FormResponse } from "@/types/form-responses"

interface EditResponseModalProps {
  responseId: string
  formId: string
  isOpen: boolean
  onClose: () => void
}

export function EditResponseModal({ responseId, formId, isOpen, onClose }: EditResponseModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [response, setResponse] = useState<FormResponse | null>(null)
  const [fields, setFields] = useState<Field[]>([])

  // Buscar dados da resposta e campos do formulário
  const { data: responseData, isLoading: isResponseLoading } = api.formResponse.getById.useQuery(
    { responseId },
    {
      enabled: isOpen && !!responseId,
    }
  )

  const { data: formData } = api.form.getById.useQuery(
    { id: formId },
    {
      enabled: isOpen && !!formId,
    }
  )

  // useEffect para carregar os dados quando o modal abre
  useEffect(() => {
    if (isOpen && responseData && formData) {
      setResponse(responseData)
      // @ts-expect-error - JsonValue to Field conversion
      setFields(formData.fields as Field[])
      setIsLoading(false)
    } else if (isOpen && !isResponseLoading) {
      setIsLoading(false)
    }
  }, [isOpen, responseData, formData, isResponseLoading])

  // Mutation para atualizar a resposta
  const updateResponse = api.formResponse.update.useMutation({
    onSuccess: () => {
      toast.success("Resposta atualizada com sucesso!")
      onClose()
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro ao atualizar resposta: ${errorMessage}`)
    },
  })

  const handleSubmit = (data: Record<string, unknown>) => {
    updateResponse.mutate({
      responseId,
      responses: [data] as Record<string, unknown>[],
    })
  }

  const handleClose = () => {
    setIsLoading(true)
    setResponse(null)
    setFields([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Resposta</DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias na resposta do formulário.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando dados...</span>
          </div>
        ) : response && fields.length > 0 ? (
          <FormResponseComponent
            formId={formId}
            fields={fields}
            existingResponse={response.responses[0] as Record<string, unknown>}
            onSubmit={handleSubmit}
            isEditing={true}
            isSubmitting={updateResponse.isPending}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground">Erro ao carregar dados da resposta.</p>
            <Button variant="outline" onClick={handleClose} className="mt-4">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

