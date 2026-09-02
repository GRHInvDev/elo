"use client"

import { cn } from "@/lib/utils"
import type { ResponseStatus } from "@/types/form-responses"

const META: Record<ResponseStatus, { short: string; label: string; dot: string; text: string; bg: string; border: string }> = {
  NOT_STARTED: {
    short: "Não iniciado",
    label: "Não iniciado",
    dot: "bg-[hsl(0_0%_55%)]",
    text: "text-muted-foreground",
    bg: "",
    border: "",
  },
  IN_PROGRESS: {
    short: "Em progresso",
    label: "Em progresso",
    dot: "bg-[hsl(38_92%_55%)]",
    text: "text-[hsl(38_92%_38%)] dark:text-[hsl(38_92%_60%)]",
    bg: "",
    border: "",
  },
  COMPLETED: {
    short: "Concluído",
    label: "Concluído",
    dot: "bg-[hsl(158_64%_45%)]",
    text: "text-[hsl(158_64%_30%)] dark:text-[hsl(158_64%_55%)]",
    bg: "",
    border: "",
  },
}

export const STATUS_META = META

interface RequestStatusPillProps {
  status: ResponseStatus
  size?: "sm" | "md"
  className?: string
}

export function RequestStatusPill({ status, size = "md", className }: RequestStatusPillProps) {
  const m = META[status] ?? META.NOT_STARTED
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-xs",
        m.text,
        m.bg,
        m.border,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", m.dot)} />
      {m.short}
    </span>
  )
}