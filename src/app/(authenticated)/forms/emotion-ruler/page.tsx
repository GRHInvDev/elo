"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedEmoji } from "@/components/emotion-ruler/animated-emoji"

export default function EmotionRulerPage() {
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: ruler, isLoading, refetch } = api.emotionRuler.getActive.useQuery()

  const createResponse = api.emotionRuler.createResponse.useMutation({
    onSuccess: () => {
      toast.success("Resposta registrada com sucesso!")
      setSelectedValue(null)
      setComment("")
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar resposta. Tente novamente.")
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const handleSubmit = async () => {
    if (!ruler) {
      toast.error("Régua de emoções não disponível")
      return
    }

    if (selectedValue === null) {
      toast.error("Por favor, selecione como você está se sentindo")
      return
    }

    setIsSubmitting(true)

    try {
      await createResponse.mutateAsync({
        rulerId: ruler.id,
        emotionValue: selectedValue,
        comment: comment.trim() || undefined,
      })
    } catch (error) {
      console.error("Erro ao criar resposta:", error)
    }
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    )
  }

  if (!ruler) {
    return (
      <DashboardShell>
        <div className="space-y-4">
          <Link href="/forms">
            <Button variant="ghost" className="pl-0">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar para formulários
            </Button>
          </Link>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma régua de emoções ativa no momento.
            </p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  // Ordenar emoções por valor
  const sortedEmotions = (Array.isArray(ruler.emotions) ? ruler.emotions : []).sort((a, b) => a.value - b.value)

  // Debug: verificar se os emojis estão sendo carregados
  if (process.env.NODE_ENV === 'development') {
    console.log('Emoções carregadas:', sortedEmotions.map(e => ({ value: e.value, emoji: e.emoji })))
  }

  // Se não há emoções, mostrar mensagem
  if (sortedEmotions.length === 0) {
    return (
      <DashboardShell>
        <div className="space-y-4">
          <Link href="/forms">
            <Button variant="ghost" className="pl-0">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar para formulários
            </Button>
          </Link>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma emoção configurada para esta régua.
            </p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <Link href="/forms">
            <Button variant="ghost" className="pl-0">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar para formulários
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-4">
            Régua de Emoções
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            As informações compartilhadas aqui serão utilizadas apenas para análise e cuidado com a saúde e o bem-estar no trabalho, sendo acessadas exclusivamente por pessoas autorizadas e protegidas conforme a legislação vigente.
          </p>
          <br />
          <p className="text-muted-foreground mt-2">
            {ruler.question}
          </p>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="space-y-6">
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
                        "flex-1 flex flex-row md:flex-col items-center justify-between md:justify-center p-4 cursor-pointer",
                        "min-h-[80px] md:min-h-[140px]",
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
                            "w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-background/50 dark:border-background/30 shadow-md flex items-center justify-center",
                            "bg-background/20 dark:bg-background/10 overflow-hidden shrink-0"
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
                              size={isSelected ? 48 : 40}
                              playOnHover={true}
                              className="drop-shadow-sm"
                            />
                          </motion.div>
                        </motion.div>
                        <motion.span
                          className={cn(
                            "text-sm font-medium md:mt-3 whitespace-nowrap",
                            "md:text-center",
                            isSelected
                              ? "font-bold text-foreground drop-shadow-sm"
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
                          Nível {emotion.value}
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
                          <p className="text-sm text-muted-foreground text-center">
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
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Botão de envio */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={selectedValue === null || isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Resposta"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
