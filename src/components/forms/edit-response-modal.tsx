"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormResponseComponent } from "./form-response"
import { api } from "@/trpc/react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldAlert, User } from "lucide-react"
import type { Field } from "@/lib/form-types"
import type { FormResponse } from "@/types/form-responses"
import { formatFormResponseNumber } from "@/lib/utils/form-response-number"

interface EditResponseModalProps {
  responseId: string
  formId: string
  isOpen: boolean
  onClose: () => void
}

export function EditResponseModal({ responseId, formId, isOpen, onClose }: EditResponseModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [response, setResponse] = useState<FormResponse | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const utils = api.useUtils()

  const { data: currentUser } = api.user.me.useQuery(undefined, { enabled: isOpen })

  // Buscar dados da resposta e campos do formulário
  const { data: responseData, isLoading: isResponseLoading } = api.formResponse.getById.useQuery(
    { responseId },
    {
      enabled: isOpen && !!responseId,
    },
  )

  const { data: formData } = api.form.getById.useQuery(
    { id: formId },
    {
      enabled: isOpen && !!formId,
    },
  )

  // useEffect para carregar os dados quando o modal abre
  useEffect(() => {
    if (isOpen && responseData && formData) {
      // `getById` já retorna os tipos normalizados (number | null, string[] | null)
      // Aqui apenas fazemos um cast centralizado para o tipo de domínio `FormResponse`
      const convertedResponse = responseData as unknown as FormResponse
      setResponse(convertedResponse)
      // @ts-expect-error - JsonValue to Field conversion
      setFields(formData.fields)
      setIsLoading(false)
    } else if (isOpen && !isResponseLoading) {
      setIsLoading(false)
    }
  }, [isOpen, responseData, formData, isResponseLoading])

  // Mutation para atualizar a resposta
  const updateResponse = api.formResponse.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Solicitação atualizada com sucesso!",
      })
      void utils.formResponse.getById.invalidate({ responseId })
      void utils.formResponse.listQueueInfinite.invalidate()
      void utils.formResponse.listUserResponses.invalidate()
      void utils.formResponse.getChat.invalidate({ responseId })
      void utils.formResponse.getQueueKpis.invalidate()
      onClose()
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      toast({
        title: "Erro ao atualizar",
        description: errorMessage,
        variant: "destructive",
      })
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

  const isEditorStaff = currentUser?.id && response?.userId && currentUser.id !== response.userId
  const requesterName = response?.user
    ? `${response.user.firstName ?? ""} ${response.user.lastName ?? ""}`.trim() || response.user.email
    : "Solicitante"

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold">Editar Solicitação</DialogTitle>
            {response?.number != null && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                {formatFormResponseNumber(response.number)}
              </span>
            )}
          </div>
          <DialogDescription className="text-xs">
            Altere os dados preenchidos nos campos do formulário.
          </DialogDescription>
        </DialogHeader>

        {isEditorStaff && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Edição Administrativa</p>
              <p className="text-[11px] opacity-90">
                Você está editando a solicitação enviada por <strong className="font-bold">{requesterName}</strong>. Esta alteração será registrada com seu usuário no histórico de auditoria e chat do chamado.
              </p>
            </div>
          </div>
        )}

        {!isEditorStaff && response && (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Editando sua solicitação enviada em {new Date(response.createdAt).toLocaleDateString("pt-BR")}.</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground">Carregando dados da solicitação...</span>
          </div>
        ) : response && fields.length > 0 ? (
          <div className="mt-2">
            <FormResponseComponent
              formId={formId}
              fields={fields}
              existingResponse={response.responses[0]}
              onSubmit={handleSubmit}
              isEditing={true}
              isSubmitting={updateResponse.isPending}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <p className="text-xs text-muted-foreground">Não foi possível carregar os dados desta solicitação.</p>
            <Button variant="outline" size="sm" onClick={handleClose} className="rounded-xl">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
