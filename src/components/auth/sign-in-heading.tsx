"use client"

import { CardDescription, CardTitle } from "@/components/ui/card"
import { usePathname } from "next/navigation"
import type { ReactElement } from "react"

/**
 * Título e descrição da tela de login conforme a etapa do Clerk (ex.: verificação em factor-one).
 */
export function SignInHeading(): ReactElement {
  const pathname = usePathname()
  const isFactorOne = pathname.includes("factor-one")

  if (isFactorOne) {
    return (
      <>
        <CardTitle>Confirme seu acesso</CardTitle>
        <CardDescription>
          Informe o código de verificação para concluir o login na elo.
        </CardDescription>
      </>
    )
  }

  return (
    <>
      <CardTitle>Bem-vindo de volta</CardTitle>
      <CardDescription>Faça login para acessar a elo</CardDescription>
    </>
  )
}
