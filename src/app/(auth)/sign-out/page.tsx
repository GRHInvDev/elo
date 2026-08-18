"use client"

import { useEffect } from "react"
import { useClerk } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

/**
 * Rota dedicada de logout.
 *
 * Encerra a sessão do Clerk e devolve o usuário ao login. Existe como rota
 * própria — e não só como item do menu — para que qualquer ponto do sistema
 * (link, atalho, redirecionamento de erro de autenticação) possa deslogar
 * navegando para /sign-out.
 */
export default function SignOutPage() {
  const { signOut } = useClerk()

  useEffect(() => {
    void signOut({ redirectUrl: "/sign-in" })
  }, [signOut])

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
      role="status"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">Saindo…</p>
        <p className="text-sm text-muted-foreground">
          Encerrando sua sessão com segurança.
        </p>
      </div>
    </div>
  )
}
