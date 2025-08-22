"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"

type ContribType = "IDEIA_INOVADORA" | "SUGESTAO_MELHORIA" | "SOLUCAO_PROBLEMA" | "OUTRO"

export function SuggestionsCard() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [contribType, setContribType] = useState<ContribType>("IDEIA_INOVADORA")
  const [contribOther, setContribOther] = useState("")

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
    },
    onError: (error) => {
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
    })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="font-semibold">Enviar sugestão</div>

        <div className="space-y-2">
          <Label htmlFor="name">Nome (opcional)</Label>
          <Input id="name" placeholder="Seu nome (opcional)" value={name} onChange={(e) => setName(e.target.value)} />
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
                name="contrib"
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
          <Button onClick={handleSubmit}>Enviar</Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Setor e data serão captados automaticamente.
        </div>
      </CardContent>
    </Card>
  )
}