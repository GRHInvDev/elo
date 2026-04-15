"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, Lightbulb } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import type { AppRouter } from "@/server/api/root"
import type { TRPCClientErrorLike } from "@trpc/client"
import Image from "next/image"
import { IdeaFieldAiEnhance } from "@/components/suggestions/idea-field-ai-enhance"
import type { SuggestionAiEnhancement } from "@/types/suggestion-ai-enhancement"

type ContribType = "IDEIA_INOVADORA" | "SUGESTAO_MELHORIA" | "SOLUCAO_PROBLEMA" | "OUTRO"



// Componente de prévia que abre modal
export function SuggestionsPreview({ onOpenModal }: { onOpenModal: () => void }) {
  // Query para buscar estatísticas e usuário
  const { data: stats, isLoading } = api.suggestion.getStats.useQuery()
  const { data: userData } = api.user.me.useQuery()
  const isTotem = userData?.role_config?.isTotem === true

  // Não renderizar nada para usuários Totem
  if (isTotem) {
    return null
  }

  return (
    <div
      onClick={() => {
        onOpenModal()
      }}
      className="cursor-pointer bg-muted hover:bg-muted/80 rounded-lg p-3 md:p-4 border hover:shadow-md transition-all duration-200 w-full group"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Image
            src="/sugestao.webp"
            alt="Ideias em Ação"
            width={80}
            height={80}
            className="rounded-lg object-cover border w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
          />
        </div>

        <div className="flex-1 space-y-1 md:space-y-2 text-left min-w-0">
          <h3 className="text-sm md:text-base lg:text-lg font-semibold text-foreground leading-tight">
            💡 Ideias em Ação
          </h3>

          {/* Estatísticas dinâmicas */}
          <div className="space-y-1">
            {isLoading ? (
              <div className="animate-pulse space-y-1">
                <div className="h-3 bg-muted-foreground/20 rounded w-3/4"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
              </div>
            ) : stats ? (
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                Faça o registro aqui e sua ideia pode ser premiada!
              </p>
            ) : null}
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium opacity-75 group-hover:opacity-100 transition-opacity">
            <span className="hidden sm:inline">Clique para abrir o formulário</span>
            <span className="sm:hidden">Toque para abrir</span>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SuggestionsCard() {
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

  // Pré-preencher o nome quando os dados do usuário chegarem
  useEffect(() => {
    if (userData) {
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ")
      setSubmittedName(fullName ?? userData.email ?? "")
    }
  }, [userData])

  // Mutation para criar ideia
  const create = api.suggestion.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Ideia enviada!",
        description: "Sua ideia foi registrada e será avaliada em breve."
      })
      // Resetar form
      setProblema("")
      setSolucao("")
      setContribType("IDEIA_INOVADORA")
      setContribOther("")
      setHideName(false)
      setHideSector(false)
      setAiEnhancementForm({})
      setFormAiSession((s) => s + 1)
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
      description: solucao.trim(), // Solução proposta → campo description no banco
      problem: problema.trim() || undefined, // Problema identificado → campo problem no banco
      contribution: {
        type: contribType,
        other: contribType === "OUTRO" ? contribOther.trim() : undefined,
      },
      submittedName: hideName ? undefined : submittedName.trim() || undefined,
      submittedSector: hideSector ? undefined : userData?.setor ?? undefined,
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

  if (userLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const userSector = userData?.setor ?? "Não informado"

  // Não renderizar nada para usuários Totem
  if (isTotem) {
    return null
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="suggestion-form" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Lightbulb className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Caixa de Ideias</h3>
                <p className="text-sm text-muted-foreground">
                  Descreva sua ideia
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="px-6 pb-6 space-y-6">
              {/* Informações do usuário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do colaborador</Label>
                  {!hideName && (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                      <span className="text-sm font-medium">{submittedName ?? userData?.email ?? "Nome não disponível"}</span>
                    </div>
                  )}
                  {hideName && (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                      <span className="text-sm text-muted-foreground italic">Nome será ocultado na ideia</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hide-name"
                      checked={hideName}
                      onCheckedChange={(checked) => {
                        setHideName(checked as boolean)
                      }}
                    />
                    <Label htmlFor="hide-name" className="text-sm text-muted-foreground">
                      Não exibir meu nome
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Setor</Label>
                  {!hideSector && (
                    <div className="flex items-center gap-2 p-2 rounded-md">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{userSector}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hide-sector"
                      checked={hideSector}
                      onCheckedChange={(checked) => {
                        setHideSector(checked as boolean)
                      }}
                    />
                    <Label htmlFor="hide-sector" className="text-sm text-muted-foreground">
                      Não exibir meu setor
                    </Label>
                  </div>
                </div>
              </div>

              {/* Tipo de contribuição */}
              <div className="space-y-2">
                <Label htmlFor="contrib-type">Tipo de contribuição</Label>
                <Select value={contribType} onValueChange={(value) => setContribType(value as ContribType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
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
                    />
                  </div>
                )}
              </div>

              {/* Problema */}
              <IdeaFieldAiEnhance
                key={`problem-${formAiSession}`}
                field="problem"
                fieldLabel="Problema identificado *"
                textareaId="problema"
                value={problema}
                onChange={setProblema}
                placeholder="Descreva o problema que você identificou..."
                rows={3}
                aiEnhancement={aiEnhancementForm}
                onAiEnhancementChange={setAiEnhancementForm}
                problemDraft={problema}
                solutionDraft={solucao}
              />
              <p className="text-xs text-muted-foreground -mt-1">
                Seja específico sobre o problema que precisa ser resolvido.
              </p>

              {/* Solução */}
              <IdeaFieldAiEnhance
                key={`description-${formAiSession}`}
                field="description"
                fieldLabel="Solução proposta *"
                textareaId="solucao"
                value={solucao}
                onChange={setSolucao}
                placeholder="Descreva a solução que você propõe..."
                rows={3}
                aiEnhancement={aiEnhancementForm}
                onAiEnhancementChange={setAiEnhancementForm}
                problemDraft={problema}
                solutionDraft={solucao}
              />
              <p className="text-xs text-muted-foreground -mt-1">
                Detalhe como sua solução pode resolver o problema identificado.
              </p>

              {/* Botão de envio */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={create.isPending || !problema.trim() || !solucao.trim()}
                  className="min-w-[120px]"
                >
                  {create.isPending ? "Enviando..." : "Enviar ideia"}
                </Button>
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

// Componente Modal com formulário completo
export function SuggestionsModal({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
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
      setSubmittedName(fullName ?? userData.email ?? "")
    }
  }, [userData])

  // Mutation para criar ideia
  const create = api.suggestion.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Ideia enviada!",
        description: "Sua ideia foi registrada e será avaliada em breve."
      })
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
      contribution: {
        type: contribType,
        other: contribType === "OUTRO" ? contribOther.trim() : undefined,
      },
      submittedName: hideName ? undefined : submittedName.trim() || undefined,
      submittedSector: hideSector ? undefined : userData?.setor ?? undefined,
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
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
              <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
            </div>
            <span className="text-lg md:text-xl font-semibold">Caixa de Ideias</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Compartilhe sua ideia inovadora e contribua para o crescimento da empresa
          </p>
        </DialogHeader>

        {userLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ) : isTotem ? (
          // Não renderizar nada para usuários Totem, apenas fechar o modal
          null
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Informações do usuário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label>Nome do colaborador</Label>
                {!hideName && (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                    <span className="text-sm font-medium">{submittedName ?? userData?.email ?? "Nome não disponível"}</span>
                  </div>
                )}
                {hideName && (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <span className="text-sm text-muted-foreground italic">Nome será ocultado na ideia</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hide-name"
                    checked={hideName}
                    onCheckedChange={(checked) => {
                      setHideName(checked as boolean)
                    }}
                  />
                  <Label htmlFor="hide-name" className="text-sm text-muted-foreground">
                    Não exibir meu nome
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Setor</Label>
                {!hideSector && (
                  <div className="flex items-center gap-2 p-2 rounded-md">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{userSector}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hide-sector"
                    checked={hideSector}
                    onCheckedChange={(checked) => {
                      setHideSector(checked as boolean)
                    }}
                  />
                  <Label htmlFor="hide-sector" className="text-sm text-muted-foreground">
                    Não exibir meu setor
                  </Label>
                </div>
              </div>
            </div>

            {/* Tipo de contribuição */}
            <div className="space-y-2">
              <Label htmlFor="contrib-type">Tipo de contribuição</Label>
              <Select value={contribType} onValueChange={(value) => setContribType(value as ContribType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
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
                  />
                </div>
              )}
            </div>

            {/* Problema */}
            <IdeaFieldAiEnhance
              key={`modal-problem-${formAiSession}`}
              field="problem"
              fieldLabel="Problema identificado *"
              textareaId="problema-modal"
              value={problema}
              onChange={setProblema}
              placeholder="Descreva o problema que você identificou..."
              rows={4}
              aiEnhancement={aiEnhancementForm}
              onAiEnhancementChange={setAiEnhancementForm}
              problemDraft={problema}
              solutionDraft={solucao}
            />
            <p className="text-xs text-muted-foreground -mt-1">
              Seja específico sobre o problema que precisa ser resolvido.
            </p>

            {/* Solução */}
            <IdeaFieldAiEnhance
              key={`modal-description-${formAiSession}`}
              field="description"
              fieldLabel="Solução proposta *"
              textareaId="solucao-modal"
              value={solucao}
              onChange={setSolucao}
              placeholder="Descreva a solução que você propõe..."
              rows={4}
              aiEnhancement={aiEnhancementForm}
              onAiEnhancementChange={setAiEnhancementForm}
              problemDraft={problema}
              solutionDraft={solucao}
            />
            <p className="text-xs text-muted-foreground -mt-1">
              Detalhe como sua solução pode resolver o problema identificado.
            </p>

            {/* Botão de envio */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={create.isPending}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={create.isPending || !problema.trim() || !solucao.trim()}
                className="w-full sm:w-auto min-w-[120px]"
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