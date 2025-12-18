"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { AnimatedEmojiPicker } from "./animated-emoji-picker"

interface EmotionRulerFormProps {
  rulerId: string | null
  onSuccess: () => void
  onCancel: () => void
}

interface Emotion {
  id?: string
  label?: string
  value: number
  emoji: string | null
  color: string
  states: string[]
  order: number
}

export function EmotionRulerForm({
  rulerId,
  onSuccess,
  onCancel,
}: EmotionRulerFormProps) {
  const [question, setQuestion] = useState("Como você está se sentindo hoje?")
  const [isActive, setIsActive] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [emotions, setEmotions] = useState<Emotion[]>([
    { value: 0, emoji: "😢", color: "#FF0000", states: ["frustrado", "chateado", "triste", "com raiva"], order: 0 },
    { value: 1, emoji: "😞", color: "#FF6B6B", states: ["desanimado", "preocupado", "ansioso"], order: 1 },
    { value: 2, emoji: "😐", color: "#FFA500", states: ["neutro", "sem grandes emoções"], order: 2 },
    { value: 3, emoji: "🙂", color: "#FFD93D", states: ["satisfeito", "tranquilo", "bem"], order: 3 },
    { value: 4, emoji: "😊", color: "#6BCF7F", states: ["feliz", "animado", "motivado"], order: 4 },
    { value: 5, emoji: "😄", color: "#00FF00", states: ["extremamente feliz", "animado", "eufórico", "radiante"], order: 5 },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: ruler, isLoading } = api.emotionRuler.getById.useQuery(
    { id: rulerId! },
    { enabled: !!rulerId }
  )

  const createMutation = api.emotionRuler.create.useMutation()
  const updateMutation = api.emotionRuler.update.useMutation()

  useEffect(() => {
    if (ruler) {
      setQuestion(ruler.question)
      setIsActive(ruler.isActive)
      setStartDate(ruler.startDate ? new Date(ruler.startDate) : null)
      setEndDate(ruler.endDate ? new Date(ruler.endDate) : null)
      setBackgroundColor(ruler.backgroundColor ?? "#ffffff")
      setEmotions(
        ruler.emotions.map((e) => ({
          id: e.id,
          value: e.value,
          emoji: e.emoji,
          color: e.color,
          states: e.states,
          order: e.order,
        }))
      )
    }
  }, [ruler])

  const handleAddEmotion = () => {
    const maxValue = Math.max(...emotions.map((e) => e.value), 0)
    const newEmotion: Emotion = {
      label: "Nova Emoção",
      states: [],
      emoji: null,
      value: Math.min(maxValue + 2, 10),
      color: "#808080",
      order: emotions.length,
    }
    setEmotions([...emotions, newEmotion])
  }

  const handleRemoveEmotion = (index: number) => {
    if (emotions.length <= 2) {
      toast.error("É necessário ter pelo menos 2 emoções")
      return
    }
    setEmotions(emotions.filter((_, i) => i !== index))
  }

  const handleUpdateEmotion = (index: number, field: keyof Emotion, value: string | number | null) => {
    const updated = [...emotions]
    updated[index] = { ...updated[index], [field]: value } as Emotion
    setEmotions(updated)
  }

  const handleAddState = (index: number) => {
    const updated = [...emotions]
    updated[index] = {
      ...updated[index],
      states: [...(updated[index]?.states ?? []), ""],
    } as Emotion
    setEmotions(updated)
  }

  const handleUpdateState = (emotionIndex: number, stateIndex: number, value: string) => {
    const updated = [...emotions]
    updated[emotionIndex] = {
      ...updated[emotionIndex],
      states: updated[emotionIndex]?.states.map((state, i) =>
        i === stateIndex ? value : state
      ),
    } as Emotion
    setEmotions(updated)
  }

  const handleRemoveState = (emotionIndex: number, stateIndex: number) => {
    const updated = [...emotions]
    updated[emotionIndex] = {
      ...updated[emotionIndex],
      states: updated[emotionIndex]?.states.filter((_, i) => i !== stateIndex),
    } as Emotion
    setEmotions(updated)
  }

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast.error("A pergunta é obrigatória")
      return
    }

    if (emotions.length < 2) {
      toast.error("É necessário ter pelo menos 2 emoções")
      return
    }

    // Validar valores únicos e range 0-5
    const values = emotions.map((e) => e.value)
    if (new Set(values).size !== values.length) {
      toast.error("Os valores dos níveis devem ser únicos")
      return
    }
    if (values.some((v) => v < 0 || v > 5)) {
      toast.error("Os valores devem estar entre 0 e 5")
      return
    }

    setIsSubmitting(true)

    try {
      const data = {
        question: question.trim(),
        isActive,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
        backgroundColor: backgroundColor ?? null,
        emotions: emotions.map((e, i) => ({
          ...e,
          order: i,
        })),
      }

      if (rulerId) {
        await updateMutation.mutateAsync({
          id: rulerId,
          ...data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }

      onSuccess()
    } catch (err) {
      toast.error("Erro ao salvar régua. Tente novamente.")
      console.error("Erro ao salvar régua:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (rulerId && isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pergunta */}
      <div className="space-y-2">
        <Label htmlFor="question">Pergunta *</Label>
        <Input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Como você está se sentindo hoje?"
        />
      </div>

      {/* Status Ativo */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Régua Ativa</Label>
          <p className="text-sm text-muted-foreground">
            Apenas uma régua pode estar ativa por vez
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Início (opcional)</Label>
          <DatePicker
            date={startDate ?? undefined}
            onDateChange={(date) => setStartDate(date)}
          />
        </div>
        <div className="space-y-2">
          <Label>Data de Fim (opcional)</Label>
          <DatePicker
            date={endDate ?? undefined}
            onDateChange={(date) => setEndDate(date)}
          />
        </div>
      </div>

      {/* Níveis de Emoção (0-5) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Níveis de Emoção (0-5) *</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Configure os 6 níveis de 0 (extremamente chateado) a 5 (extremamente feliz)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddEmotion}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Nível
          </Button>
        </div>

        <div className="space-y-4">
          {emotions
            .sort((a, b) => a.value - b.value)
            .map((emotion, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Nível {emotion.value}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveEmotion(index)}
                    disabled={emotions.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Valor */}
                  <div className="flex flex-col">
                    <Label className="text-xs mb-2 h-5 flex items-center">Valor (0-5)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={emotion.value}
                      onChange={(e) =>
                        handleUpdateEmotion(
                          index,
                          "value",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="h-9"
                    />
                  </div>
                  
                  {/* Emoji Animado */}
                  <div className="flex flex-col">
                    <Label className="text-xs mb-2 h-5 flex items-center">Emoji Animado</Label>
                    <div className="h-12">
                      <AnimatedEmojiPicker
                        value={emotion.emoji}
                        onEmojiSelect={(emoji) =>
                          handleUpdateEmotion(index, "emoji", emoji)
                        }
                      />
                    </div>
                  </div>
                  
                  {/* Cor */}
                  <div className="flex flex-col">
                    <Label className="text-xs mb-2 h-5 flex items-center">Cor</Label>
                    <div className="flex gap-2 h-12">
                      <Input
                        type="color"
                        value={emotion.color}
                        onChange={(e) =>
                          handleUpdateEmotion(index, "color", e.target.value)
                        }
                        className="w-16 h-12 cursor-pointer"
                        style={{ padding: '2px' }}
                      />
                      <Input
                        value={emotion.color}
                        onChange={(e) =>
                          handleUpdateEmotion(index, "color", e.target.value)
                        }
                        className="flex-1 h-12 text-sm"
                        placeholder="#FF0000"
                      />
                    </div>
                  </div>
                </div>

                {/* Estados/Emoções */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Estados/Emoções para este nível</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddState(index)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {emotion.states.map((state, stateIndex) => (
                      <div key={stateIndex} className="flex gap-2">
                        <Input
                          value={state}
                          onChange={(e) =>
                            handleUpdateState(index, stateIndex, e.target.value)
                          }
                          placeholder="Ex: frustrado, chateado, triste..."
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveState(index, stateIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {emotion.states.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum estado configurado. Adicione estados que descrevam este nível.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Régua"
          )}
        </Button>
      </div>
    </div>
  )
}
