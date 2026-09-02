"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { FormsPanel } from "@/components/forms/forms-sub-page-shell"

/**
 * Fronteira de erro do módulo Solicitações.
 *
 * Sem este arquivo, qualquer exceção lançada nos Server Components de
 * /forms/** (ex.: TRPCError FORBIDDEN de conta desativada, NOT_FOUND de
 * resposta excluída) sobe até o Next e renderiza a tela crua
 * "Application error: a server-side exception has occurred".
 *
 * Não usa FormsSubPageShell de propósito: aquele componente depende do
 * BreadcrumbProvider e um throw aqui dentro escalaria para o erro global.
 */
export default function FormsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[forms] Falha ao renderizar a página de solicitações:", error)
  }, [error])

  return (
    <DashboardShell>
      <div className="forms-scope">
        <FormsPanel className="mx-auto max-w-xl text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-[22px] font-bold leading-tight tracking-[-0.025em]">
                Não foi possível carregar esta solicitação
              </h1>
              <p className="text-sm text-muted-foreground">
                Ocorreu uma falha ao buscar os dados. Tente novamente — se o
                problema continuar, informe o código abaixo ao time de TI.
              </p>
            </div>
            {error.digest && (
              <p className="rounded-md border border-[hsl(var(--forms-border-soft))] bg-muted/40 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                {error.digest}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={reset}>
                <RotateCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
              <Link href="/forms">
                <Button variant="outline" className="w-full sm:w-auto">
                  Voltar para Solicitações
                </Button>
              </Link>
            </div>
          </div>
        </FormsPanel>
      </div>
    </DashboardShell>
  )
}
