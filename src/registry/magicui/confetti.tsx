"use client"

import type React from "react"
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react"

type ConfettiFireOptions = confetti.Options

export interface ConfettiRef {
  fire: (options?: ConfettiFireOptions) => void
}

type ConfettiProps = Omit<React.HTMLAttributes<HTMLDivElement>, "ref"> & {
  className?: string
}

type CanvasConfettiFn = (options?: confetti.Options) => Promise<undefined> | null

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(function Confetti(
  { className, ...rest },
  ref,
) {
  const confettiFnRef = useRef<CanvasConfettiFn | null>(null)

  const ensureLoaded = useCallback(async (): Promise<CanvasConfettiFn> => {
    if (confettiFnRef.current) return confettiFnRef.current

    const mod = (await import("canvas-confetti")) as { default: CanvasConfettiFn }
    confettiFnRef.current = mod.default
    return confettiFnRef.current
  }, [])

  const fire = useCallback(
    (options?: ConfettiFireOptions) => {
      void ensureLoaded()
        .then((fn) => {
          const burst: confetti.Options = {
            particleCount: 340,
            spread: 340,
            origin: { y: 0.6 },
            disableForReducedMotion: true,
            ...options,
          }

          const result = fn(burst)
          if (result) {
            void result.catch(() => {
              // Intencionalmente silencioso: confetti é decorativo.
            })
          }
        })
        .catch(() => {
          // Intencionalmente silencioso: confetti é decorativo e não deve quebrar a UI.
        })
    },
    [ensureLoaded],
  )

  useImperativeHandle(
    ref,
    () => ({
      fire,
    }),
    [fire],
  )

  return <div className={className} {...rest} />
})

