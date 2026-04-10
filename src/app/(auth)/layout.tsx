import type React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,hsl(var(--muted))_0%,transparent_55%)] opacity-70 dark:opacity-40"
        aria-hidden
      />
      <div className="relative grid min-h-screen place-items-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  )
}

