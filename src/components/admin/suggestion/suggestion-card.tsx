"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, Lightbulb } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import type { AppRouter } from "@/server/api/root"
import type { TRPCClientErrorLike } from "@trpc/client"

type ContribType = "IDEIA_INOVADORA" | "SUGESTAO_MELHORIA" | "SOLUCAO_PROBLEMA" | "OUTRO"

export function SuggestionsCard() {
  const [description, setDescription] = useState("")
  const [contribType, setContribType] = useState<ContribType>("IDEIA_INOVADORA")
  const [contribOther, setContribOther] = useState("")
  const [submittedName, setSubmittedName] = useState("")
  const [hideName, setHideName] = useState(false)

  // Buscar dados do usuário logado
  const { data: userData, isLoading: userLoading } = api.user.me.useQuery()

  // Pré-preencher o nome quando os dados do usuário chegarem
  useEffect(() => {
    if (userData && !hideName) {
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ")
      setSubmittedName(fullName || userData.email)
    }
  }, [userData, hideName])

  // Mutation para criar sugestão
  const create = api.suggestion.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Sugestão enviada!",
        description: "Sua ideia foi registrada e será avaliada em breve."
      })
      // Resetar form
      setDescription("")
      setContribType("IDEIA_INOVADORA")
      setContribOther("")
      setHideName(false)
      // Recarregar nome do usuário
      if (userData) {
        const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ")
        setSubmittedName(fullName || userData.email)
      }
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
    if (!description.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva sua sugestão.",
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
      description: description.trim(),
      contribution: {
        type: contribType,
        other: contribType === "OUTRO" ? contribOther.trim() : undefined,
      },
      submittedName: hideName ? undefined : submittedName.trim() || undefined,
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
    <Card className="w-full max-w-2xl">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="suggestion-form" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lightbulb className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Caixa de Sugestões</h3>
                <p className="text-sm text-muted-foreground">
                  Compartilhe suas ideias e contribuições
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="px-6 pb-6 space-y-6">
              {/* Informações do usuário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nome do colaborador</Label>
                  <Input
                    id="user-name"
                    value={submittedName}
                    onChange={(e) => setSubmittedName(e.target.value)}
                    disabled={hideName}
                    placeholder="Seu nome não aparecerá na sugestão"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hide-name"
                      checked={hideName}
                      onCheckedChange={(checked) => {
                        setHideName(checked as boolean)
                        if (checked) {
                          setSubmittedName("")
                        } else if (userData) {
                          const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ")
                          setSubmittedName(fullName || userData.email)
                        }
                      }}
                    />
                    <Label htmlFor="hide-name" className="text-sm text-muted-foreground">
                      Não exibir meu nome
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Setor</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{userSector}</span>
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

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição da sugestão *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva sua ideia, sugestão ou solução de forma detalhada..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Seja específico e detalhe como sua ideia pode beneficiar a empresa.
                </p>
              </div>

              {/* Botão de envio */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={create.isPending || !description.trim()}
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