"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Building2 } from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import type { TRPCClientErrorLike } from "@trpc/client"
import type { AppRouter } from "@/server/api/root"

type ContribType = "IDEIA_INOVADORA" | "SUGESTAO_MELHORIA" | "SOLUCAO_PROBLEMA" | "OUTRO"

const ENTERPRISES = [
  { value: "Box", label: "Box" },
  { value: "RHenz", label: "R. Henz" },
  { value: "Cristallux", label: "Cristallux" },
  { value: "NA", label: "Não informado" },
] as const

export function SuggestionsCard() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [contribType, setContribType] = useState<ContribType>("IDEIA_INOVADORA")
  const [contribOther, setContribOther] = useState("")
  const [sector, setSector] = useState<string>("")

  // Buscar informações do usuário para mostrar o setor padrão
  const { data: userData } = api.user.me.useQuery()

  // Definir setor padrão quando os dados do usuário carregarem
  useState(() => {
    if (userData?.enterprise && !sector) {
      setSector(userData.enterprise)
    }
  })

  const create = api.suggestion.create.useMutation({
    onSuccess: () => {
      toast({ 
        title: "Sugestão enviada!", 
        description: "Sua ideia foi registrada e será avaliada em breve." 
      })
      // Limpar campos após sucesso
      setName("")
      setDescription("")
      setContribType("IDEIA_INOVADORA")
      setContribOther("")
      setSector(userData?.enterprise ?? "")
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast({
        title: "Erro ao enviar",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = () => {
    if (!description.trim()) {
      toast({ title: "Informe a descrição", description: "Descrição é obrigatória." })
      return
    }
    create.mutate({
      submittedName: name.trim() || undefined,
      description: description.trim(),
      contribution: {
        type: contribType,
        other: contribType === "OUTRO" ? (contribOther.trim() || undefined) : undefined,
      },
      sector: sector || undefined,
    })
  }

  const getEnterpriseDisplayName = (enterprise: string) => {
    switch (enterprise) {
      case "Box": return "Box"
      case "RHenz": return "R. Henz"
      case "Cristallux": return "Cristallux"
      default: return "Não informado"
    }
  }

  return (
    <Card className="w-full max-w-md">
      <Accordion type="single" collapsible>
        <AccordionItem value="suggestion-form" className="border-0">
          <AccordionTrigger className="px-4 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Enviar sugestão</div>
                {userData?.enterprise && (
                  <div className="text-sm text-muted-foreground">
                    Setor padrão: {getEnterpriseDisplayName(userData.enterprise)}
                  </div>
                )}
              </div>
            </div>
          </AccordionTrigger>
          
          <AccordionContent>
            <CardContent className="p-4 pt-0 space-y-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="name">Nome (opcional)</Label>
                <Input 
                  id="name" 
                  placeholder="Seu nome (opcional)" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Setor</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTERPRISES.map((enterprise) => (
                      <SelectItem key={enterprise.value} value={enterprise.value}>
                        {enterprise.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Selecione o setor para o qual a sugestão se aplica
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de contribuição</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="contrib"
                      checked={contribType === "IDEIA_INOVADORA"}
                      onChange={() => setContribType("IDEIA_INOVADORA")}
                    />
                    <span>Ideia inovadora</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="radio"
                      checked={contribType === "SUGESTAO_MELHORIA"}
                      onChange={() => setContribType("SUGESTAO_MELHORIA")}
                    />
                    <span>Sugestão de melhoria</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="contrib"
                      checked={contribType === "SOLUCAO_PROBLEMA"}
                      onChange={() => setContribType("SOLUCAO_PROBLEMA")}
                    />
                    <span>Solução de problema</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="contrib"
                      checked={contribType === "OUTRO"}
                      onChange={() => setContribType("OUTRO")}
                    />
                    <span>Outro</span>
                  </label>
                  {contribType === "OUTRO" && (
                    <Input
                      placeholder="Descreva o tipo de contribuição"
                      value={contribOther}
                      onChange={(e) => setContribOther(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (obrigatória)</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Descreva sua sugestão/ideia"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmit} 
                  disabled={create.isPending}
                  className="w-full sm:w-auto px-8"
                >
                  {create.isPending ? "Enviando..." : "Enviar Sugestão"}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Data será captada automaticamente.
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}