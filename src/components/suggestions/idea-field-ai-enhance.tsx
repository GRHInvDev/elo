"use client"

import { useCallback, useRef, useState } from "react"
import { Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/trpc/react"
import { toast } from "@/hooks/use-toast"
import type { SuggestionAiEnhancement } from "@/types/suggestion-ai-enhancement"

const MIN_CHARS = 20

export type IdeaFormAiField = "description" | "problem"

interface IdeaFieldAiEnhanceProps {
  field: IdeaFormAiField
  fieldLabel: string
  value: string
  onChange: (next: string) => void
  textareaId: string
  placeholder: string
  rows?: number
  aiEnhancement: Pick<SuggestionAiEnhancement, "description" | "problem">
  onAiEnhancementChange: (next: SuggestionAiEnhancement) => void
  /** Valor atual do campo problema (formulário) — enviado como contexto ao aprimorar a solução. */
  problemDraft: string
  /** Valor atual do campo solução (formulário) — enviado como contexto ao aprimorar o problema. */
  solutionDraft: string
}

/**
 * Campo de texto com botão "Aprimorar com IA" e painel comparativo (original × proposta).
 */
export function IdeaFieldAiEnhance({
  field,
  fieldLabel,
  value,
  onChange,
  textareaId,
  placeholder,
  rows = 4,
  aiEnhancement,
  onAiEnhancementChange,
  problemDraft,
  solutionDraft,
}: IdeaFieldAiEnhanceProps) {
  const [pending, setPending] = useState<{ original: string; proposed: string } | null>(null)
  const [followUp, setFollowUp] = useState("")
  /** Texto do colaborador antes do primeiro aprimoramento aceito neste campo (auditoria). */
  const auditOriginalRef = useRef<string | null>(null)

  const enhance = api.suggestion.enhanceIdeaField.useMutation({
    onError: (err) => {
      toast({
        title: "Não foi possível aprimorar",
        description: err.message,
        variant: "destructive",
      })
    },
  })

  const fieldMeta = field === "description" ? aiEnhancement.description : aiEnhancement.problem
  const showAiDisclaimer = !!fieldMeta?.refinedWithAi

  const ensureAuditOriginal = useCallback(
    (currentVal: string) => {
      if (auditOriginalRef.current !== null) return
      const existing =
        field === "description" ? aiEnhancement.description : aiEnhancement.problem
      auditOriginalRef.current = existing?.collaboratorOriginal ?? currentVal
    },
    [aiEnhancement.description, aiEnhancement.problem, field]
  )

  const handleAprimorar = () => {
    const t = value.trim()
    if (t.length < MIN_CHARS) {
      toast({
        title: "Texto curto demais",
        description: `Escreva pelo menos ${MIN_CHARS} caracteres para usar o aprimoramento.`,
        variant: "destructive",
      })
      return
    }
    ensureAuditOriginal(t)
    enhance.mutate(
      {
        field,
        sourceText: t,
        problemDraft: problemDraft.trim() || undefined,
        solutionDraft: solutionDraft.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setPending({ original: t, proposed: data.refinedText })
          setFollowUp("")
        },
      }
    )
  }

  const handleRefinarNovamente = () => {
    if (!pending) return
    const instruction = followUp.trim()
    if (!instruction) {
      toast({
        title: "Instrução vazia",
        description: "Descreva o que você quer ajustar no texto gerado.",
        variant: "destructive",
      })
      return
    }
    enhance.mutate(
      {
        field,
        sourceText: pending.proposed,
        followUpInstruction: instruction,
        problemDraft: problemDraft.trim() || undefined,
        solutionDraft: solutionDraft.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setPending({ original: pending.original, proposed: data.refinedText })
          setFollowUp("")
        },
      }
    )
  }

  const acceptPending = () => {
    if (!pending) return
    ensureAuditOriginal(pending.original)
    const snapshot = auditOriginalRef.current ?? pending.original
    onChange(pending.proposed)
    const next: SuggestionAiEnhancement = { ...aiEnhancement }
    if (field === "description") {
      next.description = { collaboratorOriginal: snapshot, refinedWithAi: true }
    } else {
      next.problem = { collaboratorOriginal: snapshot, refinedWithAi: true }
    }
    onAiEnhancementChange(next)
    setPending(null)
    toast({
      title: "Texto aplicado",
      description: "Revise o conteúdo antes de enviar a ideia.",
    })
  }

  const discardPending = () => {
    setPending(null)
    setFollowUp("")
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Label htmlFor={textareaId} className="text-sm md:text-base">
          {fieldLabel}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          disabled={enhance.isPending || value.trim().length < MIN_CHARS}
          onClick={handleAprimorar}
        >
          {enhance.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden />
          )}
          Aprimorar com IA
        </Button>
      </div>
      <Textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="resize-none text-sm md:text-base"
      />
      {showAiDisclaimer && (
        <p className="text-xs text-muted-foreground italic">
          Texto aprimorado pela IA — revise antes de enviar.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        O aprimoramento exige pelo menos {MIN_CHARS} caracteres no campo.
      </p>

      {pending && (
        <div className="mt-3 space-y-3 rounded-lg border bg-muted/20 p-3 md:p-4 animate-in fade-in-0 duration-200">
          <div className="text-sm font-medium">Comparar versões</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">Sua redação</div>
              <div className="max-h-56 overflow-y-auto rounded-md border bg-background p-2 text-sm whitespace-pre-wrap">
                {pending.original}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">Texto sugerido (sem formatação Markdown)</div>
              <div className="max-h-56 overflow-y-auto rounded-md border bg-background p-2 text-sm whitespace-pre-wrap">
                {pending.proposed}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${textareaId}-followup`} className="text-xs">
              Ajustar o texto sugerido (opcional)
            </Label>
            <Textarea
              id={`${textareaId}-followup`}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder={
                field === "problem"
                  ? "Ex.: Deixe mais curto; deixe claro quem sofre com o problema; não sugerir soluções."
                  : "Ex.: Deixe mais curto; detalhe só o que eu já mencionei; não repetir o problema inteiro."
              }
              rows={2}
              className="resize-none text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={enhance.isPending || !followUp.trim()}
                onClick={handleRefinarNovamente}
              >
                {enhance.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Aplicar ajuste ao texto gerado
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" onClick={acceptPending}>
              Aceitar proposta
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={discardPending}>
              Descartar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
