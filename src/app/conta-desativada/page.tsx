"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldX } from "lucide-react"

// Carrega o botão de sair do Clerk apenas no cliente
const SignOutButton = dynamic(
  () => import("@clerk/nextjs").then((m) => m.SignOutButton),
  { ssr: false },
)

export default function ContaDesativadaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle className="text-xl">Conta desativada</CardTitle>
          <CardDescription>
            Seu acesso à plataforma foi desativado. No momento você não consegue
            visualizar nem utilizar nenhuma área do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se você acredita que isso é um engano, entre em contato com o setor de
            Recursos Humanos ou com o administrador do sistema.
          </p>
          <SignOutButton redirectUrl="/sign-in">
            <Button variant="outline" className="w-full">
              Sair
            </Button>
          </SignOutButton>
        </CardContent>
      </Card>
    </div>
  )
}
