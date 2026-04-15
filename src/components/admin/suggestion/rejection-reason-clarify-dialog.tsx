"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"

import { api } from "@/trpc/react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type RejectionClarifyDrafts = {
  impact?: { text: string; score: number }
  capacity?: { text: string; score: number }
  effort?: { text: string; score: number }
}

interface RejectionReasonClarifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestionId: string
  /** Texto atual do campo motivo (pode estar vazio na primeira geração). */
  draftRejectionReason: string
  /** Classificações como na tela (rascunho ou salvas). */
  drafts: RejectionClarifyDrafts
  onApply: (clarifiedText: string) => void
  /** Se definido, o texto aplicado é truncado (ex.: lista em accordion com max 1000). */
  applyMaxLength?: number
}

/**
 * Diálogo: IA esclarece o motivo da não implementação com base no contexto da ideia + rascunho do gestor,
 * com campo opcional para instruções adicionais e nova geração.
 */
export function RejectionReasonClarifyDialog({
  open,
  onOpenChange,
  suggestionId,
  draftRejectionReason,
  drafts,
  onApply,
  applyMaxLength,
}: RejectionReasonClarifyDialogProps) {
  const [refinementPrompt, setRefinementPrompt] = useState("")
  const [preview, setPreview] = useState<string | null>(null)

  const mutation = api.suggestion.clarifyRejectionReasonWithAi.useMutation({
    onSuccess: (data) => {
      setPreview(data.clarifiedReason)
      toast({
        title: "Texto gerado",
        description: "Revise e aplique ao campo de motivo se estiver adequado.",
      })
    },
    onError: (error) => {
      toast({
        title: "Não foi possível gerar o texto",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleGenerate = () => {
    mutation.mutate({
      suggestionId,
      draftRejectionReason,
      ...(drafts.impact ? { draftImpact: drafts.impact } : {}),
      ...(drafts.capacity ? { draftCapacity: drafts.capacity } : {}),
      ...(drafts.effort ? { draftEffort: drafts.effort } : {}),
      ...(refinementPrompt.trim() ? { userRefinementPrompt: refinementPrompt.trim() } : {}),
    })
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPreview(null)
      setRefinementPrompt("")
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" aria-hidden />
            Esclarecer motivo com IA
          </DialogTitle>
          <DialogDescription>
            A IA usa o problema, a solução, as classificações (impacto, capacidade, esforço), a nota Morrison se
            existir e o texto que você já escreveu no motivo. Opcionalmente, descreva como quer ajustar o texto
            (tom, ênfase, detalhes) e gere de novo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="rejection-refine-prompt">Instruções adicionais (opcional)</Label>
            <Textarea
              id="rejection-refine-prompt"
              placeholder="Ex.: deixe mais empático; mencione priorização; encurte para duas frases…"
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              className="min-h-[72px]"
              maxLength={1500}
            />
            <p className="text-xs text-muted-foreground">{refinementPrompt.length}/1500</p>
          </div>

          <Button
            type="button"
            className="w-full gap-2 sm:w-auto"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={handleGenerate}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            {preview ? "Gerar novamente" : "Gerar texto"}
          </Button>

          {preview ? (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Label className="text-xs font-medium text-muted-foreground">Pré-visualização</Label>
              <p className="text-sm whitespace-pre-wrap">{preview}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Fechar
          </Button>
          <Button
            type="button"
            disabled={!preview}
            onClick={() => {
              if (preview) {
                const t =
                  applyMaxLength != null ? preview.slice(0, applyMaxLength) : preview
                onApply(t)
                if (applyMaxLength != null && preview.length > applyMaxLength) {
                  toast({
                    title: "Texto truncado",
                    description: `O motivo foi limitado a ${applyMaxLength} caracteres neste campo.`,
                  })
                }
                handleOpenChange(false)
              }
            }}
          >
            Aplicar ao campo de motivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
