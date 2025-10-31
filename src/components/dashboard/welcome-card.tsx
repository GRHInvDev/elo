"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/trpc/react"
import { Confetti } from "@/components/ui/confetti"

export function WelcomeCard() {
  const { data: newCollaborator, refetch } = api.user.checkNewCollaborator.useQuery()
  const markAsNotNew = api.user.markAsNotNew.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  const [showConfetti, setShowConfetti] = useState(true)
  const [isClosing, setIsClosing] = useState(false)

  // Esconder confetti após animação
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!newCollaborator?.isNew) {
    return null
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      markAsNotNew.mutate()
    }, 300)
  }

  if (isClosing) {
    return null
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <Card className="relative overflow-hidden border-2 border-primary shadow-lg animate-in fade-in slide-in-from-top-5 duration-500">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  🎉 Bem-vindo(a) à Intranet!
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Estamos muito felizes em tê-lo(a) conosco! Esta é sua nova plataforma de comunicação interna.
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-medium">Aqui você pode:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Acompanhar eventos e notícias da empresa</li>
                  <li>Enviar suas ideias e sugestões</li>
                  <li>Fazer pedidos de alimentação</li>
                  <li>Reservar salas e veículos</li>
                  <li>E muito mais!</li>
                </ul>
              </div>

              <Button
                onClick={handleClose}
                className="mt-4"
                size="sm"
              >
                Começar a explorar
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>

        {/* Balões animados decorativos */}
        <div className="absolute top-4 right-4 w-16 h-16 opacity-20 animate-bounce">
          <div className="text-4xl">🎈</div>
        </div>
        <div className="absolute top-8 right-16 w-12 h-12 opacity-15 animate-bounce delay-150">
          <div className="text-3xl">🎈</div>
        </div>
        <div className="absolute bottom-4 right-8 w-14 h-14 opacity-20 animate-bounce delay-300">
          <div className="text-3xl">🎈</div>
        </div>
      </Card>
    </>
  )
}

