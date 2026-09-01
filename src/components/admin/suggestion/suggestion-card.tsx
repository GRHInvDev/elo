"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Building2, User } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import type { AppRouter } from "@/server/api/root"
import type { TRPCClientErrorLike } from "@trpc/client"
import { IdeaFieldAiEnhance } from "@/components/suggestions/idea-field-ai-enhance"
import type { SuggestionAiEnhancement } from "@/types/suggestion-ai-enhancement"

type ContribType = "IDEIA_INOVADORA" | "SUGESTAO_MELHORIA" | "SOLUCAO_PROBLEMA" | "OUTRO"

// Componente Modal com formulário completo
export function SuggestionsModal({
  isOpen,
  onOpenChange,
  campaignId,
  isCampaignPrivate = false,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  campaignId?: string | null
  isCampaignPrivate?: boolean
}) {
  const [formAiSession, setFormAiSession] = useState(0)
  const [aiEnhancementForm, setAiEnhancementForm] = useState<SuggestionAiEnhancement>({})
  const [problema, setProblema] = useState("")
  const [solucao, setSolucao] = useState("")
  const [contribType, setContribType] = useState<ContribType>("IDEIA_INOVADORA")
  const [contribOther, setContribOther] = useState("")
  const [submittedName, setSubmittedName] = useState("")
  const [hideName, setHideName] = useState(false)
  const [hideSector, setHideSector] = useState(false)

  // Buscar dados do usuário logado
  const { data: userData, isLoading: userLoading } = api.user.me.useQuery()
  const isTotem = userData?.role_config?.isTotem === true

  // Fechar modal automaticamente se for usuário Totem
  useEffect(() => {
    if (isTotem && isOpen) {
      onOpenChange(false)
    }
  }, [isTotem, isOpen, onOpenChange])

  useEffect(() => {
    if (!isOpen) {
      setAiEnhancementForm({})
      return
    }
    setFormAiSession((s) => s + 1)
  }, [isOpen])

  // Pré-preencher o nome quando os dados do usuário chegarem
  useEffect(() => {
    if (userData) {
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ")
      setSubmittedName(fullName ?? userData.email)
    }
  }, [userData])

  const utils = api.useUtils()

  // Mutation para criar ideia
  const create = api.suggestion.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Ideia enviada!",
        description: "Sua ideia foi registrada e será avaliada em breve."
      })
      void utils.suggestion.invalidate()
      void utils.campaign.invalidate()
      // Resetar form e fechar modal
      setProblema("")
      setSolucao("")
      setContribType("IDEIA_INOVADORA")
      setContribOther("")
      setHideName(false)
      setHideSector(false)
      setAiEnhancementForm({})
      onOpenChange(false)
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast({
        title: "Erro ao enviar",
        description: error.message ?? "Tente novamente em alguns instantes.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = () => {
    if (!problema.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva o problema.",
        variant: "destructive",
      })
      return
    }

    if (!solucao.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva a solução proposta.",
        variant: "destructive",
      })
      return
    }

    if (contribType === "OUTRO" && !contribOther.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, especifique o tipo de contribuição.",
        variant: "destructive",
      })
      return
    }

    const hasAiMeta =
      !!aiEnhancementForm.description?.refinedWithAi ||
      !!aiEnhancementForm.problem?.refinedWithAi

    create.mutate({
      description: solucao.trim(),
      problem: problema.trim() || undefined,
      campaignId: campaignId ?? undefined,
      contribution: {
        type: contribType,
        other: contribType === "OUTRO" ? contribOther.trim() : undefined,
      },
      submittedName: isCampaignPrivate && hideName ? undefined : submittedName.trim() || undefined,
      submittedSector: isCampaignPrivate && hideSector ? undefined : userData?.setor ?? undefined,
      ...(hasAiMeta
        ? {
            aiEnhancement: {
              ...(aiEnhancementForm.description
                ? { description: aiEnhancementForm.description }
                : {}),
              ...(aiEnhancementForm.problem ? { problem: aiEnhancementForm.problem } : {}),
            },
          }
        : {}),
    })
  }

  const userSector = userData?.setor ?? "Não informado"

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <span>Enviar Ideia</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Descreva detalhadamente sua sugestão ou solução para a campanha.
          </DialogDescription>
        </DialogHeader>

        {userLoading ? (
          <div className="animate-pulse space-y-4 py-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ) : isTotem ? null : (
          <div className="space-y-5 pt-2">
            {/* Informações do Autor */}
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 sm:p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Autor
                  </Label>
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground bg-background/80 border rounded-lg px-3 py-2">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {isCampaignPrivate && hideName
                        ? "Anônimo (nome ocultado)"
                        : submittedName ?? userData?.email ?? "Nome não disponível"}
                    </span>
                  </div>
                  {isCampaignPrivate && (
                    <div className="flex items-center space-x-2 pt-1">
                      <Checkbox
                        id="hide-name"
                        checked={hideName}
                        onCheckedChange={(checked) => setHideName(checked as boolean)}
                      />
                      <Label htmlFor="hide-name" className="text-xs text-muted-foreground cursor-pointer">
                        Ocultar meu nome (Campanha privada)
                      </Label>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Setor
                  </Label>
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground bg-background/80 border rounded-lg px-3 py-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {isCampaignPrivate && hideSector
                        ? "Ocultado"
                        : userSector}
                    </span>
                  </div>
                  {isCampaignPrivate && (
                    <div className="flex items-center space-x-2 pt-1">
                      <Checkbox
                        id="hide-sector"
                        checked={hideSector}
                        onCheckedChange={(checked) => setHideSector(checked as boolean)}
                      />
                      <Label htmlFor="hide-sector" className="text-xs text-muted-foreground cursor-pointer">
                        Ocultar meu setor (Campanha privada)
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tipo de contribuição */}
            <div className="space-y-2">
              <Label htmlFor="contrib-type" className="text-xs sm:text-sm font-medium">
                Tipo de contribuição
              </Label>
              <Select
                value={contribType}
                onValueChange={(value) => setContribType(value as ContribType)}
              >
                <SelectTrigger id="contrib-type" className="rounded-xl">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="IDEIA_INOVADORA">Ideia inovadora</SelectItem>
                  <SelectItem value="SUGESTAO_MELHORIA">Ideia de melhoria</SelectItem>
                  <SelectItem value="SOLUCAO_PROBLEMA">Solução de problema</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>

              {contribType === "OUTRO" && (
                <div className="mt-2">
                  <Input
                    value={contribOther}
                    onChange={(e) => setContribOther(e.target.value)}
                    placeholder="Especifique o tipo de contribuição"
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Problema */}
            <div className="space-y-1">
              <IdeaFieldAiEnhance
                key={`modal-problem-${formAiSession}`}
                field="problem"
                fieldLabel="Problema identificado *"
                textareaId="problema-modal"
                value={problema}
                onChange={setProblema}
                placeholder="Descreva claramente o problema ou oportunidade que você identificou..."
                rows={3}
                aiEnhancement={aiEnhancementForm}
                onAiEnhancementChange={setAiEnhancementForm}
                problemDraft={problema}
                solutionDraft={solucao}
              />
            </div>

            {/* Solução */}
            <div className="space-y-1">
              <IdeaFieldAiEnhance
                key={`modal-description-${formAiSession}`}
                field="description"
                fieldLabel="Solução proposta *"
                textareaId="solucao-modal"
                value={solucao}
                onChange={setSolucao}
                placeholder="Descreva a solução que você propõe e os benefícios esperados..."
                rows={4}
                aiEnhancement={aiEnhancementForm}
                onAiEnhancementChange={setAiEnhancementForm}
                problemDraft={problema}
                solutionDraft={solucao}
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={create.isPending}
                className="w-full sm:w-auto rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={create.isPending || !problema.trim() || !solucao.trim()}
                className="w-full sm:w-auto min-w-[140px] rounded-xl font-bold cursor-pointer"
              >
                {create.isPending ? "Enviando..." : "Enviar ideia"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}