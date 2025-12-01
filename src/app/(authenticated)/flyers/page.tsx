import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { DashboardShell } from "@/components/dashboard-shell"
import { FlyersList } from "@/components/flyers-list"
import { CreateFlyerButton } from "@/components/create-flyer-button"
import { api } from "@/trpc/server"
import { canCreateFlyer } from "@/lib/access-control"

export const metadata: Metadata = {
  title: "Encartes | elo",
  description: "Encartes da empresa",
}

export default async function FlyersPage() {
  let user;
  
  try {
    user = await currentUser();
  } catch (error) {
    console.warn('[FlyersPage] Erro ao obter usuário:', error instanceof Error ? error.message : 'Erro desconhecido');
    redirect("/sign-in?redirect_url=/flyers");
  }

  if (!user) {
    redirect("/sign-in?redirect_url=/flyers")
  }

  // Buscar dados do usuário para verificar permissões de criação
  const userData = await api.user.me()

  // SISTEMA SIMPLIFICADO: Todos podem visualizar, apenas verificar permissão de criação
  // Bloquear apenas usuários TOTEM
  if (userData.role_config?.isTotem) {
    redirect("/dashboard")
  }

  // Verificar se o usuário tem permissão para criar encartes
  const canCreate = canCreateFlyer(userData.role_config)

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Encartes</h2>
          <p className="text-muted-foreground">
            {canCreate 
              ? "Confira os encartes disponíveis e crie novos encartes" 
              : "Confira os encartes disponíveis"
            }
          </p>
        </div>
        {canCreate && <CreateFlyerButton />}
      </div>
      <FlyersList />
    </DashboardShell>
  )
}
