"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ArrowRight,
  CalendarDays,
  Car,
  Lightbulb,
  PartyPopper,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"
import { Confetti } from "@/components/ui/confetti"

/**
 * Itens estáticos fora do componente — evita recriar o array a cada render.
 */
const WELCOME_FEATURES = [
  {
    icon: CalendarDays,
    text: "Acompanhar eventos e notícias da empresa",
  },
  {
    icon: Lightbulb,
    text: "Enviar ideias e sugestões",
  },
  {
    icon: UtensilsCrossed,
    text: "Fazer pedidos de alimentação",
  },
  {
    icon: Car,
    text: "Reservar salas e veículos",
  },
  {
    icon: Sparkles,
    text: "Explorar muito mais na Intranet",
  },
] as const

export function WelcomeCard() {
  const { data: newCollaborator, refetch } = api.user.checkNewCollaborator.useQuery()
  const markAsNotNew = api.user.markAsNotNew.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })
  const { data: currentUser } = api.user.me.useQuery()

  const [showConfetti, setShowConfetti] = useState(true)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowConfetti(false)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    window.setTimeout(() => {
      markAsNotNew.mutate()
    }, 300)
  }, [markAsNotNew])

  if (!newCollaborator?.isNew) {
    return null
  }

  if (isClosing) {
    return null
  }

  return (
    <>
      {showConfetti ? <Confetti /> : null}
      <Card
        className={cn(
          "w-full rounded-2xl",
          "relative overflow-hidden border border-primary/25 bg-gradient-to-b from-card via-card to-primary/[0.04]",
          "shadow-lg shadow-primary/5 ring-1 ring-primary/10",
          "animate-in fade-in slide-in-from-top-5 duration-500",
        )}
      >
        {/* Decoração leve — apenas camadas CSS, sem JS extra */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-2xl"
          aria-hidden
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute right-2 top-2 z-10 h-9 w-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:right-3 md:top-3"
          aria-label="Fechar mensagem de boas-vindas"
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="relative space-y-0 pb-3 pt-4 pr-11 md:pb-4 md:pt-5 md:pr-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                "bg-primary/12 text-primary shadow-inner ring-1 ring-primary/20",
              )}
            >
              <PartyPopper className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
              <span className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary sm:text-xs">
                Primeiro acesso
              </span>
              <CardTitle className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Bem-vindo(a) à Intranet{currentUser?.firstName ? `, ${currentUser.firstName}` : ""}!
              </CardTitle>
              <CardDescription className="max-w-3xl text-pretty text-xs leading-snug text-muted-foreground sm:text-sm">
                Central de comunicação interna — tudo o que você precisa em um só lugar.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-3 pb-4 pt-0 sm:space-y-4 sm:pb-5">
          <p className="text-xs font-semibold text-foreground sm:text-sm">O que você pode fazer por aqui</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 md:grid-rows-2">
            {WELCOME_FEATURES.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex gap-2.5 rounded-xl border border-border/60 bg-muted/40 px-2.5 py-2 transition-colors hover:border-primary/25 hover:bg-muted/60 dark:bg-muted/20"
              >
                <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background/80 text-primary shadow-sm ring-1 ring-border/50">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </span>
                <span className="text-xs leading-snug text-muted-foreground sm:text-[13px]">{text}</span>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            onClick={handleClose}
            className="mt-0.5 gap-2 shadow-sm sm:w-fit"
            size="sm"
          >
            Começar a explorar
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
