"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { AnimatedEmoji } from "@/components/emotion-ruler/animated-emoji"

interface EmotionRulerModalProps {
  rulerId: string
  question: string
  emotions: Array<{
    id: string
    value: number
    label: string | null
    emoji: string | null
    color: string
    states: string[]
    points: number
    order: number
  }>
  backgroundColor?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmotionRulerModal({
  rulerId,
  question,
  emotions,
  backgroundColor,
  open,
  onOpenChange,
}: EmotionRulerModalProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const registerDismissal = api.emotionRuler.registerDismissal.useMutation()
  const createResponse = api.emotionRuler.createResponse.useMutation()

  useEffect(() => {
    if (!open) {
      setSelectedValue(null)
      setComment("")
    }
  }, [open])

  const handleClose = () => {
    registerDismissal.mutate(
      { rulerId },
      {
        onSuccess: () => onOpenChange(false),
        onError: () => onOpenChange(false),
      }
    )
  }

  const handleSubmit = async () => {
    if (selectedValue === null) {
      toast.error("Por favor, selecione como você está se sentindo")
      return
    }

    setIsSubmitting(true)

    try {
      await createResponse.mutateAsync({
        rulerId,
        emotionValue: selectedValue,
        comment: comment.trim() || undefined,
      })

      toast.success("Resposta registrada com sucesso!")

      onOpenChange(false)
    } catch (error) {
      toast.error("Erro ao registrar resposta. Tente novamente.")
      console.error("Erro ao criar resposta:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sortedEmotions = (Array.isArray(emotions) ? emotions : []).sort((a, b) => a.order - b.order)

  if (sortedEmotions.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[90vh] md:max-h-[85vh] p-0 flex flex-col overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        style={
          backgroundColor && backgroundColor.toLowerCase() !== "#ffffff"
            ? { backgroundColor }
            : undefined
        }
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl md:text-2xl mb-2 pr-2">{question}</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Selecione na régua com base na pergunta!
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {/* Régua de Emoções */}
          <div className="space-y-4">
            <div className="w-full flex flex-col md:flex-row gap-1 rounded-lg overflow-hidden border-2 border-border bg-background">
              {sortedEmotions.map((emotion) => {
                const isSelected = selectedValue === emotion.value

                return (
                  <button
                    key={emotion.id}
                    onClick={() => setSelectedValue(emotion.value)}
                    className={cn(
                      "flex-1 flex flex-row md:flex-col items-center justify-between md:justify-center p-3 cursor-pointer",
                      "min-h-[80px] md:min-h-[100px]",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      "border-b md:border-b-0 md:border-r border-border/50 dark:border-border/30",
                      "last:border-b-0 md:last:border-r-0",
                      "transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]",
                      isSelected && "ring-2 ring-primary ring-offset-2 z-10"
                    )}
                    style={{ backgroundColor: emotion.color }}
                  >
                    <div className="flex items-center gap-3 md:flex-col md:w-full overflow-hidden">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full border-2 border-background/50 dark:border-background/30 shadow-md flex items-center justify-center shrink-0",
                          "bg-background/20 dark:bg-background/10 overflow-hidden",
                          "transition-transform duration-150",
                          isSelected && "scale-110"
                        )}
                      >
                        <AnimatedEmoji
                          emoji={emotion.emoji}
                          size={isSelected ? 28 : 20}
                          playOnHover={true}
                          className="drop-shadow-sm"
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium md:mt-2 text-center w-full leading-tight break-words",
                          isSelected ? "font-bold drop-shadow-sm" : "text-foreground/80"
                        )}
                      >
                        {emotion.label ?? `Nível ${emotion.value}`}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Estados da seleção */}
            <AnimatePresence>
              {selectedValue !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border"
                >
                  <p className="text-sm font-medium text-center text-foreground">
                    {(() => {
                      const sel = sortedEmotions.find((e) => e.value === selectedValue)
                      return `Você selecionou: ${sel?.label ?? `Nível ${selectedValue}`}`
                    })()}
                  </p>
                  {(() => {
                    const selectedEmotion = sortedEmotions.find((e) => e.value === selectedValue)
                    if (!selectedEmotion || selectedEmotion.states.length === 0) {
                      return (
                        <p className="text-sm text-center">
                          Nenhum estado configurado para este nível
                        </p>
                      )
                    }
                    return (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {selectedEmotion.states.map((state, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-background dark:bg-background/80 border border-border rounded-full text-sm text-foreground"
                          >
                            {state}
                          </span>
                        ))}
                      </div>
                    )
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Campo de comentário */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Deseja adicionar algum comentário?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">A resposta é opcional</p>
            <p className="text-xs text-muted-foreground">
              As informações compartilhadas aqui serão utilizadas apenas para análise e cuidado com a saúde e o bem-estar no trabalho, sendo acessadas exclusivamente por pessoas autorizadas e protegidas conforme a legislação vigente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Fechar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedValue === null || isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Resposta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
