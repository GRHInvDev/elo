"use client"

import { useCallback, useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { APP_CURRENT_VERSION, APP_RELEASE_NOTES } from "@/const/app-release-notes"
import { Confetti, type ConfettiRef } from "@/registry/magicui/confetti"

const NOVIDADES_CONFETTI_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#A78BFA"]

interface AppReleaseNotesDialogProps {
  /** `small`: apenas ícone (header e sidebar recolhida). Caso omitido: botão com texto "Novidades". */
  size?: "small"
}

export function AppReleaseNotesDialog({ size }: AppReleaseNotesDialogProps) {
  const isSmall = size === "small"
  const [open, setOpen] = useState(false)
  const confettiRef = useRef<ConfettiRef>(null)

  const fireNovidadesConfetti = useCallback(() => {
    const colors = NOVIDADES_CONFETTI_COLORS
    const burst = (delay: number, opts: { origin: { x: number; y: number }; angle?: number; particleCount?: number; spread?: number }) => {
      window.setTimeout(() => {
        confettiRef.current?.fire({
          particleCount: opts.particleCount ?? 72,
          spread: opts.spread ?? 62,
          angle: opts.angle ?? 90,
          origin: opts.origin,
          colors,
          ticks: 220,
          gravity: 1.05,
          scalar: 0.95,
        })
      }, delay)
    }

    burst(0, { origin: { x: 0.5, y: 0.2 }, particleCount: 90, spread: 70 })
    burst(120, { origin: { x: 0.15, y: 0.45 }, angle: 60, particleCount: 55, spread: 55 })
    burst(200, { origin: { x: 0.85, y: 0.45 }, angle: 120, particleCount: 55, spread: 55 })
    burst(320, { origin: { x: 0.5, y: 0.55 }, particleCount: 40, spread: 80 })
  }, [])

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (next) {
        requestAnimationFrame(() => fireNovidadesConfetti())
      }
    },
    [fireNovidadesConfetti],
  )

  return (
    <>
      <Confetti ref={confettiRef} className="pointer-events-none fixed inset-0 z-[100] size-full" aria-hidden />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {isSmall ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Abrir novidades do aplicativo"
            >
              <Sparkles className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              aria-label="Abrir novidades do aplicativo"
            >
              <Sparkles className="mr-2 size-7 shrink-0" aria-hidden />
              <span>Novidades</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="grid max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="space-y-2 border-b px-5 pb-4 pt-5 text-left sm:px-6 sm:pb-4 sm:pt-6">
            <DialogTitle className="flex items-start gap-2 pr-10 text-left text-lg sm:text-xl">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span className="leading-snug">Novidades do elo</span>
            </DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed">
              Versão atual: <span className="font-medium text-foreground">{APP_CURRENT_VERSION}</span>
              {" · "}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-5 py-4 sm:px-6">
            <ol className="min-w-0 space-y-6">
              {APP_RELEASE_NOTES.map((release) => (
                <li
                  key={release.version}
                  className="border-b border-border/60 pb-6 last:border-0 last:pb-0"
                >
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-base font-semibold text-foreground">v{release.version}</span>
                    <span className="text-xs text-muted-foreground">{release.date}</span>
                  </div>
                  <ul className="list-disc space-y-3 pl-4 text-sm text-muted-foreground marker:text-primary/80 sm:pl-5">
                    {release.items.map((item, i) => (
                      <li
                        key={i}
                        className="break-words leading-relaxed [&_strong]:font-semibold [&_strong]:text-foreground"
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <span className="inline">{children}</span>,
                          }}
                        >
                          {item}
                        </ReactMarkdown>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>

          <p className="border-t bg-muted/20 px-5 py-3 text-center text-xs leading-snug text-muted-foreground sm:px-6">
            Novidades são atualizadas a cada release. Dúvidas? Fale com o time de TI.
          </p>
        </DialogContent>
    </Dialog>
    </>
  )
}
