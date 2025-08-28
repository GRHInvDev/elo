"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

type ContribType = "IDEIA_INOVADORA" | "SUGESTAO_MELHORIA" | "SOLUCAO_PROBLEMA" | "OUTRO"

// Componente de prévia que abre modal
export function SuggestionsPreview({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div
      onClick={onOpenModal}
      className="cursor-pointer bg-muted hover:bg-muted/80 rounded-lg p-3 md:p-4 border hover:shadow-md transition-all duration-200 w-full"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Image
            src="/sugestao.webp"
            alt="Ideias em Acao"
            width={80}
            height={80}
            className="rounded-lg object-cover border w-24 h-24"
          />
        </div>

        <div className="flex-1 space-y-2 text-left">
          <h3 className="text-base md:text-lg font-semibold text-foreground">
            Ideias em ação
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Registre aqui a sua sugestão. Sua ideia pode ser premiada!
          </p>
          <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            Clique para abrir o formulário
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SuggestionsCard() {
  const [problema, setProblema] = useState("")
  const [solucao, setSolucao] = useState("")
  const [contribType, setContribType] = useState<ContribType>("IDEIA_INOVADORA")
  const [contribOther, setContribOther] = useState("")
  const [submittedName, setSubmittedName] = useState("")
  const [hideName, setHideName] = useState(false)
  const [hideSector, setHideSector] = useState(false)

  // Buscar dados do usuário logado
  const { data: userData, isLoading: userLoading } = api.user.me.useQuery()

  // Pré-preencher o nome quando os dados do usuário chegarem
  useEffect(() => {
    if (userData) {
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ")
      setSubmittedName(fullName || userData.email)
    }
  }, [userData])

  // Mutation para criar sugestão
  const create = api.suggestion.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Sugestão enviada!",
        description: "Sua ideia foi registrada e será avaliada em breve."
      })
      // Resetar form
      setProblema("")
      setSolucao("")
      setContribType("IDEIA_INOVADORA")
      setContribOther("")
      setHideName(false)
      setHideSector(false)
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

    create.mutate({
      description: solucao.trim(), // Solução proposta → campo description no banco
      problem: problema.trim() || undefined, // Problema identificado → campo problem no banco
      contribution: {
        type: contribType,
        other: contribType === "OUTRO" ? contribOther.trim() : undefined,
      },
      submittedName: hideName ? undefined : submittedName.trim() || undefined,
      submittedSector: hideSector ? undefined : userData?.setor ?? undefined,
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
                <h3 className="text-lg font-semibold">Caixa de Sugestões</h3>
                <p className="text-sm text-muted-foreground">
                  Descreva sua sugestão
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
                      <span className="text-sm text-muted-foreground italic">Nome será ocultado na sugestão</span>
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
                    <SelectItem value="SUGESTAO_MELHORIA">Sugestão de melhoria</SelectItem>
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
              <div className="space-y-2">
                <Label htmlFor="problema" className="text-sm md:text-base">Problema identificado *</Label>
                <Textarea
                  id="problema"
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  placeholder="Descreva o problema que você identificou..."
                  rows={3}
                  className="resize-none text-sm md:text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Seja específico sobre o problema que precisa ser resolvido.
                </p>
              </div>

              {/* Solução */}
              <div className="space-y-2">
                <Label htmlFor="solucao" className="text-sm md:text-base">Solução proposta *</Label>
                <Textarea
                  id="solucao"
                  value={solucao}
                  onChange={(e) => setSolucao(e.target.value)}
                  placeholder="Descreva a solução que você propõe..."
                  rows={3}
                  className="resize-none text-sm md:text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Detalhe como sua solução pode resolver o problema identificado.
                </p>
              </div>

              {/* Botão de envio */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={create.isPending || !problema.trim() || !solucao.trim()}
                  className="min-w-[120px]"
                >
                  {create.isPending ? "Enviando..." : "Enviar Sugestão"}
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
  const [problema, setProblema] = useState("")
  const [solucao, setSolucao] = useState("")
  const [contribType, setContribType] = useState<ContribType>("IDEIA_INOVADORA")
  const [contribOther, setContribOther] = useState("")
  const [submittedName, setSubmittedName] = useState("")
  const [hideName, setHideName] = useState(false)
  const [hideSector, setHideSector] = useState(false)

  // Buscar dados do usuário logado
  const { data: userData, isLoading: userLoading } = api.user.me.useQuery()

  // Pré-preencher o nome quando os dados do usuário chegarem
  useEffect(() => {
    if (userData) {
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ")
      setSubmittedName(fullName || userData.email)
    }
  }, [userData])

  // Mutation para criar sugestão
  const create = api.suggestion.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Sugestão enviada!",
        description: "Sua ideia foi registrada e será avaliada em breve."
      })
      // Resetar form e fechar modal
      setProblema("")
      setSolucao("")
      setContribType("IDEIA_INOVADORA")
      setContribOther("")
      setHideName(false)
      setHideSector(false)
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

    create.mutate({
      description: solucao.trim(),
      problem: problema.trim() || undefined,
      contribution: {
        type: contribType,
        other: contribType === "OUTRO" ? contribOther.trim() : undefined,
      },
      submittedName: hideName ? undefined : submittedName.trim() || undefined,
      submittedSector: hideSector ? undefined : userData?.setor ?? undefined,
    })
  }

  const userSector = userData?.setor ?? "Não informado"

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
            </div>
            <span className="text-lg md:text-xl">Caixa de Sugestões</span>
          </DialogTitle>
        </DialogHeader>

        {userLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
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
                    <span className="text-sm text-muted-foreground italic">Nome será ocultado na sugestão</span>
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
                  <SelectItem value="SUGESTAO_MELHORIA">Sugestão de melhoria</SelectItem>
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
            <div className="space-y-2">
              <Label htmlFor="problema">Problema identificado *</Label>
              <Textarea
                id="problema"
                value={problema}
                onChange={(e) => setProblema(e.target.value)}
                placeholder="Descreva o problema que você identificou..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Seja específico sobre o problema que precisa ser resolvido.
              </p>
            </div>

            {/* Solução */}
            <div className="space-y-2">
              <Label htmlFor="solucao">Solução proposta *</Label>
              <Textarea
                id="solucao"
                value={solucao}
                onChange={(e) => setSolucao(e.target.value)}
                placeholder="Descreva a solução que você propõe..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Detalhe como sua solução pode resolver o problema identificado.
              </p>
            </div>

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
                {create.isPending ? "Enviando..." : "Enviar Sugestão"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}