import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"

import { api } from "@/trpc/server"
import { canViewEmotionRuler } from "@/lib/access-control"
import { EmotionRulerResponseForm } from "@/components/emotion-ruler/emotion-ruler-response-form"

export const metadata: Metadata = {
  title: "Régua de Emoções | elo",
  description: "Régua de emoções para acompanhamento do bem-estar",
}

// Módulo restrito (não liberado para todos): guard de servidor garante que apenas
// usuários autorizados (sudo ou can_view_emotion_ruler) cheguem à página.
export default async function EmotionRulerPage() {
  let user

  try {
    user = await currentUser()
  } catch (error) {
    console.warn('[EmotionRulerPage] Erro ao obter usuário:', error instanceof Error ? error.message : 'Erro desconhecido')
    redirect("/sign-in?redirect_url=/forms/emotion-ruler")
  }

  if (!user) {
    redirect("/sign-in?redirect_url=/forms/emotion-ruler")
  }

  // role_config já vem mascarado por getEffectiveRoleConfig (TOTEM/desativado).
  const userData = await api.user.me()

  if (!canViewEmotionRuler(userData.role_config)) {
    redirect("/forms")
  }

  return <EmotionRulerResponseForm />
}
