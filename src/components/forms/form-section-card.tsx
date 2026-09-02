"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FormSectionCardProps {
  icon?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
}

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
        "rounded-[var(--forms-radius-card)] border border-[hsl(var(--forms-border-soft))] bg-[hsl(var(--card)/.75)] p-6 shadow-[var(--forms-shadow)] backdrop-blur-sm",
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