"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

import { claimAutoReload } from "@/lib/auto-reload"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/** Em qual boundary o erro caiu: rota (layout preservado) ou root layout. */
type BoundaryScope = "route" | "global"

export interface ErrorFallbackProps {
  error: Error & { digest?: string }
  /** Reexecuta o segmento que falhou. Ausente quando não há retry possível. */
  reset?: () => void
  scope: BoundaryScope
}

const CHUNK_RELOAD_KEY = "elo:chunk-reload-at"

const CHUNK_ERROR_PATTERN =
  /loading chunk \S+ failed|loading css chunk|failed to fetch dynamically imported module|importing a module script failed/i

/**
 * Identifica falha de download de chunk — o build que gerou a página saiu do ar
 * (deploy novo) e os arquivos que ela referencia respondem 404.
 */
function isChunkLoadError(error: Error): boolean {
  return error.name === "ChunkLoadError" || CHUNK_ERROR_PATTERN.test(error.message)
}


/**
 * Monta o relatório técnico do erro em texto puro.
 *
 * Inclui `userAgent` de propósito: a maior parte dos erros que só reproduzem em
 * aparelho antigo (Safari do iOS) depende de qual WebKit está rodando, e esses
 * aparelhos não têm console acessível sem um Mac ligado por cabo.
 */
function buildErrorReport(
  error: Error & { digest?: string },
  scope: BoundaryScope,
): string {
  const lines: string[] = [
    `escopo: ${scope}`,
    `tipo: ${error.name.length > 0 ? error.name : "Error"}`,
    `mensagem: ${error.message.length > 0 ? error.message : "(sem mensagem)"}`,
    `chunkLoadError: ${isChunkLoadError(error) ? "sim" : "nao"}`,
  ]

  if (error.digest) {
    lines.push(`digest: ${error.digest}`)
  }

  if (typeof window !== "undefined") {
    lines.push(`url: ${window.location.href}`)
    lines.push(`userAgent: ${window.navigator.userAgent}`)
  }

  lines.push(`stack:\n${error.stack ?? "(sem stack)"}`)

  return lines.join("\n")
}

/**
 * Copia via Clipboard API e, quando ela não existe ou é bloqueada (Safari antigo,
 * contexto não seguro), cai no `execCommand` sobre um textarea temporário.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Segue para o fallback abaixo.
  }

  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand("copy")
    document.body.removeChild(textarea)
    return copied
  } catch {
    return false
  }
}

/**
 * Tela de falha do app.
 *
 * Falha de chunk é tratada à parte: ela não é defeito da aplicação, e sim uma
 * aba que ficou aberta durante um deploy novo. Nesse caso a página se recarrega
 * sozinha — o HTML novo referencia os chunks novos e a navegação segue. Para os
 * demais erros, mostra mensagem ao usuário e deixa o erro real acessível no
 * console e na própria tela, para diagnóstico em aparelhos sem inspetor.
 */
export function ErrorFallback({ error, reset, scope }: ErrorFallbackProps) {
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle")
  const [autoReloadGaveUp, setAutoReloadGaveUp] = useState(false)
  const reloadAttemptedRef = useRef(false)
  const report = buildErrorReport(error, scope)
  const chunkError = isChunkLoadError(error)

  useEffect(() => {
    // Log estruturado: é isto que aparece no Web Inspector / console remoto.
    console.error(`[elo] erro de client side (${scope})`, error)
    console.error(`[elo] relatório\n${report}`)
  }, [error, report, scope])

  useEffect(() => {
    if (!chunkError || reloadAttemptedRef.current) {
      return
    }
    reloadAttemptedRef.current = true

    if (claimAutoReload(CHUNK_RELOAD_KEY)) {
      window.location.reload()
      return
    }

    setAutoReloadGaveUp(true)
  }, [chunkError])

  const handleCopy = useCallback(() => {
    void copyToClipboard(report).then((copied) => {
      setCopyState(copied ? "done" : "failed")
    })
  }, [report])

  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

  // Recarregando: não mostra tela de erro, o usuário não precisa saber disso.
  if (chunkError && !autoReloadGaveUp) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground" role="status">
          Atualizando para a versão mais recente…
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl">
            {chunkError ? "Não foi possível atualizar a página" : "Algo quebrou por aqui"}
          </CardTitle>
          <CardDescription>
            {chunkError
              ? "A versão aberta no seu aparelho ficou desatualizada e a atualização automática não funcionou. Feche a aba e abra a intranet de novo."
              : "A página não conseguiu carregar. Você pode tentar de novo — se continuar, copie os detalhes abaixo e envie para o time de TI."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="break-words text-sm font-medium text-foreground">
              {error.message.length > 0
                ? error.message
                : "Erro sem mensagem (provável falha ao carregar um script)."}
            </p>
            {error.digest ? (
              <p className="mt-1 text-xs text-muted-foreground">
                digest: {error.digest}
              </p>
            ) : null}
          </div>

          <details className="rounded-lg border border-border bg-muted/40">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
              Detalhes técnicos
            </summary>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words px-3 pb-3 text-xs leading-relaxed text-muted-foreground">
              {report}
            </pre>
          </details>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          {reset ? (
            <Button className="w-full sm:w-auto" onClick={reset}>
              Tentar novamente
            </Button>
          ) : null}
          <Button
            className="w-full sm:w-auto"
            onClick={handleReload}
            variant="outline"
          >
            Recarregar página
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleCopy}
            variant="ghost"
          >
            {copyState === "done"
              ? "Copiado"
              : copyState === "failed"
                ? "Copie manualmente acima"
                : "Copiar detalhes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
