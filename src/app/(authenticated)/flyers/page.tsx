import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Encartes | elo",
  description: "Módulo de encartes desativado",
}

// Módulo de Encartes desativado permanentemente (decisão de produto).
// A rota é mantida apenas para redirecionar acessos diretos/legados ao dashboard.
// O router/dados de flyer permanecem intactos no servidor, mas sem ponto de acesso na UI.
export default function FlyersPage() {
  redirect("/dashboard")
}
