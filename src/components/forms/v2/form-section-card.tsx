"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface FormSectionCardProps {
  /**
   * Ícone opcional exibido no cabeçalho (badge teal). Recebe o elemento já
   * renderizado — `icon={<FileText />}` — e não o componente.
   *
   * Este componente é client: um Server Component não consegue passar funções
   * pela fronteira RSC (o serializador lança "Functions cannot be passed
   * directly to Client Components", mascarado em produção como erro genérico
   * de render). Como ReactNode, funciona nos dois lados. O tamanho do ícone
   * fica a cargo do próprio cartão, via `[&>svg]`.
   */
  icon?: React.ReactNode
  /** Título da seção. Quando omitido, o cabeçalho não é renderizado. */
  title?: React.ReactNode
  /** Descrição curta abaixo do título. */
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Cartão de seção padrão das telas internas de Solicitações (responder e
 * personalizar). Usa o vocabulário visual do módulo Solicitações: bordas suaves,
 * sombra, badge teal de ícone e título 15px/600.
 */
export function FormSectionCard({
  icon,
  title,
  description,
  children,
  className,
}: FormSectionCardProps) {
  const hasHeader = Boolean(icon ?? title ?? description)

  return (
    <section
      className={cn(
        "rounded-[var(--v2-radius-card)] border border-[hsl(var(--v2-border-soft))] bg-[hsl(var(--card)/.75)] p-6 shadow-[var(--v2-shadow)] backdrop-blur-sm",
        className,
      )}
    >
      {hasHeader && (
        <div className="mb-5 flex items-start gap-3">
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--brand-accent)/.2)] bg-[hsl(var(--brand-accent)/.1)] text-[hsl(var(--brand-accent))] [&>svg]:h-5 [&>svg]:w-5">
              {icon}
            </div>
          )}
          {(title ?? description) && (
            <div className="min-w-0">
              {title && (
                <h2 className="text-[15px] font-semibold leading-tight tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
