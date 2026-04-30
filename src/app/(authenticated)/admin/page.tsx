import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, LayoutDashboard } from "lucide-react"

import {
  ADMIN_ROUTES,
  type AdminRoute,
  hasAccessToAdminRoute,
} from "@/const/admin-routes"
import { checkAdminAccess } from "@/lib/access-control-server"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Administração | Intranet",
  description: "Painel de gestão e ferramentas administrativas",
}

const ADMIN_HOME_SECTIONS: {
  title: string
  subtitle: string
  routeIds: readonly string[]
}[] = [
  {
    title: "Pessoas e permissões",
    subtitle: "Cadastro, papéis e acesso ao sistema",
    routeIds: ["/admin/users"],
  },
  {
    title: "Comunicação na intranet",
    subtitle: "Conteúdo para colaboradores e engajamento",
    routeIds: [
      "/admin/birthday",
      "/admin/hall-entrada",
      "/admin/news",
      "/admin/emotion-ruler",
    ],
  },
  {
    title: "Operações e infraestrutura",
    subtitle: "Alimentação, salas, frota e recursos físicos",
    routeIds: ["/admin/food", "/admin/rooms", "/admin/vehicles", "/admin/filiais"],
  },
  {
    title: "Ideias, loja e qualidade",
    subtitle: "Sugestões, produtos e documentação",
    routeIds: ["/admin/suggestions", "/admin/products", "/admin/quality"],
  },
]

function AdminToolRow({ route }: { route: AdminRoute }) {
  const Icon = route.icon
  return (
    <Link
      href={route.path}
      className={cn(
        "group flex h-full min-h-[5.5rem] items-center gap-4 rounded-xl border border-border/80 bg-card px-4 py-3.5 shadow-sm",
        "transition-all duration-200",
        "hover:border-primary/25 hover:bg-accent/40 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
          "bg-primary/10 text-primary",
          "transition-colors group-hover:bg-primary/15",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="font-medium leading-tight text-foreground">{route.title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
          {route.description}
        </p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  )
}

export default async function AdminHomePage() {
  const db_user = await checkAdminAccess("/admin")

  const availableRoutes = ADMIN_ROUTES.filter((route) => {
    if (route.id === "/admin") return true
    if (!db_user.role_config?.sudo) {
      return hasAccessToAdminRoute(
        db_user.role_config?.admin_pages ?? [],
        route.id,
        db_user.role_config?.can_manage_produtos === true,
        db_user.role_config?.can_manage_quality_management === true,
        db_user.role_config?.can_manage_emotion_rules === true,
        db_user.role_config?.can_manage_new_users_hall === true,
        db_user.role_config?.can_manage_filial === true,
      )
    }
    return true
  })

  const byId = new Map(availableRoutes.map((r) => [r.id, r] as const))

  const sectionsWithRoutes = ADMIN_HOME_SECTIONS.map((section) => ({
    ...section,
    routes: section.routeIds
      .map((id) => byId.get(id))
      .filter((r): r is AdminRoute => r !== undefined && r.id !== "/admin"),
  })).filter((s) => s.routes.length > 0)

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-8 px-1 pb-8 md:px-2">
        <header className="space-y-2 border-b pb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
              aria-hidden
            >
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Painel administrativo
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Acesso rápido às ferramentas de gestão disponíveis para o seu perfil.
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-10">
          {sectionsWithRoutes.map((section, index) => (
            <section key={section.title} className="space-y-4">
              {index > 0 ? <Separator className="opacity-60" /> : null}
              <div className="space-y-1 px-0.5">
                <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
              </div>
              <ul
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                role="list"
              >
                {section.routes.map((route) => (
                  <li key={route.id} className="min-w-0">
                    <AdminToolRow route={route} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}
