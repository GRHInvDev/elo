"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedEmoji } from "@/components/emotion-ruler/animated-emoji"

interface EmotionRulerModalProps {
  rulerId: string
  question: string
  emotions: Array<{
    id: string
    value: number
    emoji: string | null
    color: string
    states: string[]
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

  // Resetar estado quando modal fechar
  useEffect(() => {
    if (!open) {
      setSelectedValue(null)
      setComment("")
    }
  }, [open])

  const handleClose = () => {
    // Registrar que foi fechado no X (isso marca o acesso do dia)
    registerDismissal.mutate(
      { rulerId },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: () => {
          // Mesmo com erro, fechar o modal
          onOpenChange(false)
        },
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
      // Criar resposta (isso também marca o acesso do dia)
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

  // Ordenar emoções por valor
  const sortedEmotions = (Array.isArray(emotions) ? emotions : []).sort((a, b) => a.value - b.value)

  // Se não há emoções, não renderizar
  if (sortedEmotions.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[90vh] md:max-h-[85vh] p-0 flex flex-col overflow-hidden"
        onInteractOutside={(e) => {
          // Prevenir fechamento ao clicar fora - usuário deve fechar explicitamente
          e.preventDefault()
        }}
        style={{
          backgroundColor: backgroundColor ?? undefined,
        }}
      >
        {/* Header fixo */}
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl md:text-2xl mb-2 pr-2">{question}</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Selecione na régua o com base na pergunta!
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {/* Régua de Emoções */}
          <div className="space-y-4">
            {/* Régua com quadrados separados - Mobile: vertical, Desktop: horizontal */}
            <div className="w-full flex flex-col md:flex-row gap-1 rounded-lg overflow-hidden border-2 border-border bg-background">
              {sortedEmotions.map((emotion, index) => {
                const isSelected = selectedValue === emotion.value

                return (
                  <motion.button
                    key={emotion.id}
                    onClick={() => setSelectedValue(emotion.value)}
                    className={cn(
                      "flex-1 flex flex-row md:flex-col items-center justify-between md:justify-center p-3 cursor-pointer",
                      "min-h-[80px] md:min-h-[100px]",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      "border-b md:border-b-0 md:border-r border-border/50 dark:border-border/30",
                      "last:border-b-0 md:last:border-r-0",
                      isSelected && "ring-2 ring-primary ring-offset-2 z-10"
                    )}
                    style={{
                      backgroundColor: emotion.color,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      delay: index * 0.1,
                      duration: 0.3,
                      ease: "easeOut"
                    }}
                    whileHover={{
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Mobile: emoji à esquerda, texto à direita */}
                    <div className="flex items-center gap-3 md:flex-col">
                      <motion.div
                        className={cn(
                          "w-10 h-10 rounded-full border-2 border-background/50 dark:border-background/30 shadow-md flex items-center justify-center shrink-0",
                          "bg-background/20 dark:bg-background/10 overflow-hidden"
                        )}
                        animate={{
                          scale: isSelected ? 1.2 : 1,
                          rotate: isSelected ? [0, -10, 10, -10, 0] : 0,
                        }}
                        transition={{
                          scale: { duration: 0.2 },
                          rotate: {
                            duration: 0.5,
                            times: [0, 0.25, 0.5, 0.75, 1]
                          }
                        }}
                      >
                        <motion.div
                          animate={{
                            scale: isSelected ? [1, 1.3, 1] : 1,
                          }}
                          transition={{
                            duration: 0.4,
                            times: [0, 0.5, 1]
                          }}
                        >
                          <AnimatedEmoji
                            emoji={emotion.emoji}
                            size={isSelected ? 28 : 20}
                            playOnHover={true}
                            className="drop-shadow-sm"
                          />
                        </motion.div>
                      </motion.div>
                      <motion.span
                        className={cn(
                          "text-xs font-medium md:mt-2 whitespace-nowrap",
                          "md:text-center",
                          isSelected
                            ? "font-bold drop-shadow-sm"
                            : "text-foreground/80"
                        )}
                        animate={{
                          y: isSelected ? [0, -2, 0] : 0,
                        }}
                        transition={{
                          duration: 0.3,
                          times: [0, 0.5, 1]
                        }}
                      >
                        {emotion.value}
                      </motion.span>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Estados/Emoções da seleção */}
            <AnimatePresence>
              {selectedValue !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border"
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm font-medium text-center text-foreground"
                  >
                    Você selecionou o nível {selectedValue}
                  </motion.p>
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
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            className="px-3 py-1 bg-background dark:bg-background/80 border border-border rounded-full text-sm text-foreground"
                            whileHover={{ scale: 1.05 }}
                          >
                            {state}
                          </motion.span>
                        ))}
                      </div>
                    )
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Campo de comentário opcional */}
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
            <Label className="text-muted-foreground text-sm mt-6">
              As informações compartilhadas aqui serão utilizadas apenas para análise e cuidado com a saúde e o bem-estar no trabalho, sendo acessadas exclusivamente por pessoas autorizadas e protegidas conforme a legislação vigente.
            </Label>
          </div>
        </div>

        {/* Botões de ação - fixo no final */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleSubmit}
              disabled={selectedValue === null || isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Resposta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog >
  )
}
