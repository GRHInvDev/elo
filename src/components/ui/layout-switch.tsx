"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { useLayoutPreference } from "@/contexts/layout-preference-context"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface LayoutSwitchProps {
  className?: string
  compact?: boolean
}

export function LayoutSwitch({ className, compact }: LayoutSwitchProps) {
  const { layout, toggleLayout, ready } = useLayoutPreference()
  const on = layout === "v2"

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleLayout}
            aria-pressed={on}
            aria-label={on ? "Voltar ao layout clássico" : "Ativar novo layout"}
            disabled={!ready}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              "disabled:opacity-50 disabled:pointer-events-none",
              on
                ? "border-[hsl(var(--brand-accent)/.45)] bg-[hsl(var(--brand-accent)/.1)] text-[hsl(var(--brand-accent))]"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
              className,
            )}
          >
            <Sparkles className={cn("h-3.5 w-3.5", on ? "text-[hsl(var(--brand-accent))]" : "")} />
            {!compact && <span>Novo layout</span>}
            <span
              className={cn(
                "ml-0.5 h-2 w-2 rounded-full transition-colors",
                on ? "bg-[hsl(var(--brand-accent))]" : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {on
            ? "Novo layout do módulo Solicitações ativado para você."
            : "Ativar o novo layout do módulo Solicitações (preferência individual)."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
