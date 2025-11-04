"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ExternalLink, Loader2, Play } from "lucide-react"

interface LazyIframeProps {
  src: string
  title?: string
  className?: string
  /** Se true, tenta auto-carregar quando o modal ganhar foco/visibilidade */
  autoLoad?: boolean
  /** Placeholder customizado enquanto não carregado */
  placeholder?: React.ReactNode
  /** Texto do botão de carregar */
  loadLabel?: string
  /** Mostrar link para abrir em nova aba */
  showOpenNewTab?: boolean
}

export function LazyIframe({
  src,
  title = "Conteúdo externo",
  className,
  autoLoad = false,
  placeholder,
  loadLabel = "Carregar encarte (pode ser pesado)",
  showOpenNewTab = true,
}: LazyIframeProps) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Evitar recriar handlers
  const handleLoadClick = useCallback(() => {
    setShouldLoad(true)
    setHasError(false)
  }, [])

  // Auto load opcional (ex. quando o modal abriu e usuário interagiu)
  useEffect(() => {
    if (autoLoad) {
      // adiar um tick para evitar stutter de abertura
      const t = setTimeout(() => setShouldLoad(true), 50)
      return () => clearTimeout(t)
    }
  }, [autoLoad])

  // sandbox mínimo necessário para visualização de PDFs/visualizadores
  const sandbox = useMemo(() => (
    "allow-scripts allow-same-origin allow-popups"
  ), [])

  return (
    <div className={cn("relative w-full h-full", className)}>
      {!shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            {placeholder ?? (
              <div className="text-sm text-muted-foreground max-w-md">
                Para melhorar o desempenho em dispositivos mais fracos, o encarte só será carregado sob demanda.
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button onClick={handleLoadClick} className="min-w-[220px]">
                <Play className="h-4 w-4 mr-2" />
                {loadLabel}
              </Button>
              {showOpenNewTab && (
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Abrir em nova aba
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {shouldLoad && (
        <>
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-white/80">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Carregando…</span>
              </div>
            </div>
          )}

          <iframe
            title={title}
            src={src}
            className={cn("w-full h-full border-0 bg-background", isLoaded ? "" : "opacity-0")}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox={sandbox}
            allow="fullscreen"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar o encarte aqui. Tente abrir em nova aba.
                </p>
                {showOpenNewTab && (
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm underline underline-offset-4"
                  >
                    Abrir encarte
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}


