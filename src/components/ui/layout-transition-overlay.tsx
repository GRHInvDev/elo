"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { useLayoutPreference } from "@/contexts/layout-preference-context"

/**
 * Overlay full-screen exibido ao alternar o "Novo layout".
 * Combina um shimmer de skeleton com uma barra de progresso e
 * uma pílula central anunciando o destino, simulando um reload da página.
 */
export function LayoutTransitionOverlay() {
  const { transitioning, pendingTo } = useLayoutPreference()
  const [shouldRender, setShouldRender] = React.useState(false)

  React.useEffect(() => {
    if (transitioning) {
      setShouldRender(true)
      return
    }
    // Mantém montado mais um instante para o fade-out terminar
    const t = setTimeout(() => setShouldRender(false), 320)
    return () => clearTimeout(t)
  }, [transitioning])

  if (!shouldRender) return null

  const labelTarget = pendingTo === "v2" ? "Novo layout" : "Layout clássico"
  const subtitle =
    pendingTo === "v2"
      ? "Aplicando o novo visual do módulo Solicitações…"
      : "Voltando ao visual clássico…"

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center print:hidden",
        transitioning ? "opacity-100" : "opacity-0",
        "transition-opacity duration-300",
      )}
    >
      {/* Backdrop com gradiente da identidade */}
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-md",
          "bg-[radial-gradient(60%_55%_at_92%_8%,hsl(var(--v2-glow-a)/var(--v2-glow-op)),transparent_60%),radial-gradient(55%_60%_at_6%_96%,hsl(var(--v2-glow-b)/var(--v2-glow-op)),transparent_62%),hsl(var(--background)/.88)]",
        )}
      />

      {/* Skeleton de página em camadas */}
      <div className="absolute inset-0 flex flex-col gap-4 p-6 md:p-10">
        <SkeletonBlock className="h-9 w-1/3" delay={0} />
        <SkeletonBlock className="h-3 w-1/2" delay={60} />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SkeletonBlock className="h-20 rounded-xl" delay={100} />
          <SkeletonBlock className="h-20 rounded-xl" delay={160} />
          <SkeletonBlock className="h-20 rounded-xl" delay={220} />
          <SkeletonBlock className="h-20 rounded-xl" delay={280} />
        </div>
        <div className="mt-3 grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-3">
            <SkeletonBlock className="h-10 rounded-md" delay={340} />
            <SkeletonBlock className="h-7 w-1/3 rounded-full" delay={400} />
            <SkeletonBlock className="h-20 rounded-xl" delay={460} />
            <SkeletonBlock className="h-20 rounded-xl" delay={520} />
            <SkeletonBlock className="h-20 rounded-xl" delay={580} />
          </div>
          <div className="hidden lg:flex flex-col gap-3">
            <SkeletonBlock className="h-10 rounded-xl" delay={420} />
            <SkeletonBlock className="h-16 rounded-xl" delay={480} />
            <SkeletonBlock className="h-16 rounded-xl" delay={540} />
            <SkeletonBlock className="h-9 rounded-md" delay={600} />
          </div>
        </div>
      </div>

      {/* Pílula central */}
      <div
        className={cn(
          "relative flex flex-col items-center gap-4 rounded-2xl border border-[hsl(var(--brand-accent)/.35)] bg-background/85 px-7 py-6 shadow-2xl backdrop-blur",
          "elo-overlay-pop",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--brand-accent)/.12)] text-[hsl(var(--brand-accent))]">
            <Sparkles className="h-4 w-4" />
            <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(var(--brand-accent)/.3)]" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">{labelTarget}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Barra de progresso indeterminada */}
        <div className="relative h-1 w-56 overflow-hidden rounded-full bg-muted/60">
          <div
            className="elo-overlay-progress absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-[hsl(var(--brand-accent))] to-transparent"
          />
        </div>
      </div>

      <style>{`
        @keyframes elo-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes elo-overlay-pop {
          0% { transform: scale(.92); opacity: 0; }
          60% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes elo-overlay-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        .elo-overlay-pop { animation: elo-overlay-pop .42s cubic-bezier(.2,.8,.2,1) both; }
        .elo-overlay-progress { animation: elo-overlay-progress 1.05s cubic-bezier(.65,0,.35,1) infinite; }
        .elo-skeleton {
          background: linear-gradient(
            90deg,
            hsl(var(--muted) / .55) 0%,
            hsl(var(--muted) / .85) 50%,
            hsl(var(--muted) / .55) 100%
          );
          background-size: 200% 100%;
          animation: elo-shimmer 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

interface SkeletonBlockProps {
  className?: string
  delay?: number
}

function SkeletonBlock({ className, delay = 0 }: SkeletonBlockProps) {
  return (
    <div
      className={cn(
        "elo-skeleton rounded-md opacity-0",
        "elo-skeleton-rise",
        className,
      )}
      style={{
        animationDelay: `${delay}ms, 0s`,
      }}
    >
      <style>{`
        @keyframes elo-rise {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: .9; }
        }
        .elo-skeleton-rise { animation-name: elo-rise, elo-shimmer; animation-duration: .42s, 1.4s; animation-fill-mode: forwards, none; animation-iteration-count: 1, infinite; animation-timing-function: cubic-bezier(.2,.8,.2,1), ease-in-out; }
      `}</style>
    </div>
  )
}
