import type React from "react"

// As telas de autenticação não podem ser prerenderizadas: o HTML estático fica
// preso aos hashes de chunk do build que o gerou e, depois de um deploy novo,
// aponta para arquivos que já saíram do ar — o <SignIn> do Clerk não hidrata e
// o form simplesmente não aparece. Renderizando por request, o HTML sempre
// referencia o deploy corrente e sai com no-store.
export const dynamic = "force-dynamic"

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
        <div className="w-full min-w-0 max-w-md">{children}</div>
      </div>
    </div>
  )
}

