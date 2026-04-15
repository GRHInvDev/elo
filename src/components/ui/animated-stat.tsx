"use client"

import type { ComponentProps, ReactNode } from "react"
import { motion } from "framer-motion"

import { useCountUp } from "@/hooks/use-count-up"
import { cn } from "@/lib/utils"

const enterTransition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1] as const,
}

type MotionSpanProps = ComponentProps<typeof motion.span>

function AnimatedFigure({
  className,
  children,
  ...motionRest
}: { className?: string; children: ReactNode } & Omit<
  MotionSpanProps,
  "children" | "className" | "initial" | "animate" | "transition"
>) {
  return (
    <motion.span
      className={cn("tabular-nums inline-block", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={enterTransition}
      {...motionRest}
    >
      {children}
    </motion.span>
  )
}

export function AnimatedPercent({
  value,
  className,
  delayMs = 0,
}: {
  value: number | null
  className?: string
  delayMs?: number
}) {
  const n = useCountUp(value, { durationMs: 950, delayMs })
  if (value == null || n === null) {
    return <span className={cn("tabular-nums", className)}>—</span>
  }
  return <AnimatedFigure className={className}>{Math.round(n)}%</AnimatedFigure>
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export function AnimatedBrl({
  value,
  className,
  delayMs = 0,
}: {
  value: number
  className?: string
  delayMs?: number
}) {
  const n = useCountUp(value, { durationMs: 1000, delayMs })
  if (n === null) {
    return <span className={cn("tabular-nums", className)}>{brl.format(0)}</span>
  }
  return (
    <AnimatedFigure className={className}>{brl.format(Math.round(n * 100) / 100)}</AnimatedFigure>
  )
}

export function AnimatedInteger({
  value,
  className,
  delayMs = 0,
  durationMs = 850,
}: {
  value: number
  className?: string
  delayMs?: number
  durationMs?: number
}) {
  const n = useCountUp(value, { durationMs, delayMs })
  if (n === null) {
    return <span className={cn("tabular-nums", className)}>0</span>
  }
  return <AnimatedFigure className={className}>{Math.round(n)}</AnimatedFigure>
}
