"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLayoutPreference } from "@/contexts/layout-preference-context"

interface FormsSubPageShellProps {
  /** Destino do link "voltar". Omitido = sem link de voltar. */
  backHref?: string
  backLabel?: string
  title: React.ReactNode
  /** Conteúdo inline renderizado antes do título (ex.: nº da resposta). */
  titlePrefix?: React.ReactNode
  /** Texto/descrição abaixo do título. */
  description?: React.ReactNode
  /** Ações alinhadas ao topo direito (botões, links). */
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Casca padronizada das páginas internas de Solicitações (criação, visualização e
 * gestão). Respeita a preferência individual de layout: quando o usuário está no
 * "Novo layout" (v2), aplica o mesmo vocabulário visual da página de Solicitações
 * (escopo .v2-scope, título 28px, link de voltar em pílula, bordas suaves).
 * Caso contrário, mantém a aparência clássica.
 */
export function FormsSubPageShell({
  backHref,
  backLabel = "Voltar",
  title,
  titlePrefix,
  description,
  actions,
  children,
  className,
}: FormsSubPageShellProps) {
  const { layout, ready } = useLayoutPreference()
  const isV2 = ready && layout === "v2"

  if (isV2) {
    return (
      <div className={cn("v2-scope", className)}>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--v2-border-soft))] bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {backLabel}
              </Link>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {titlePrefix}
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em]">
                {title}
              </h1>
            </div>
            {description && (
              <div className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                {description}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
              {actions}
            </div>
          )}
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-8">
        {backHref && (
          <Link href={backHref}>
            <Button variant="ghost" className="pl-0">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Button>
          </Link>
        )}
        <div
          className={cn(
            "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
            backHref && "mt-4",
          )}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {titlePrefix}
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            </div>
            {description && (
              <div className="mt-2 text-muted-foreground">{description}</div>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

interface FormsPanelProps {
  children: React.ReactNode
  className?: string
}

/**
 * Painel de conteúdo padronizado. Em v2 usa as bordas suaves/sombra do redesign;
 * no clássico mantém o cartão neutro tradicional.
 */
export function FormsPanel({ children, className }: FormsPanelProps) {
  const { layout, ready } = useLayoutPreference()
  const isV2 = ready && layout === "v2"

  return (
    <div
      className={cn(
        isV2
          ? "rounded-[var(--v2-radius-card)] border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.75)] p-6 shadow-[var(--v2-shadow)] backdrop-blur-sm"
          : "rounded-lg border bg-card p-6",
        className,
      )}
    >
      {children}
    </div>
  )
}
