import { LucideCalendar, LucideCar, LucideFormInput, LucideLayoutDashboard, LucideMapPin, LucideMessageSquare, LucideNewspaper, LucideShoppingCart, LucideTerminalSquare, LucideUtensils, LucideLightbulb } from "lucide-react"
import { type RolesConfig } from "@/types/role-config"

export const routeItems = (roleConfig?: RolesConfig | null): {
  title: string
  icon: React.ElementType
  describe: string
  href: string
}[] => {
  // Verificar se é um usuário TOTEM (apenas Dashboard, Eventos, Encartes)
  if (roleConfig && 'isTotem' in roleConfig && roleConfig.isTotem) {
    return [
      {
        title: "Dashboard",
        icon: LucideLayoutDashboard,
        describe: "Página principal da intranet",
        href: "/dashboard",
      },
      {
        title: "Eventos",
        icon: LucideCalendar,
        describe: "Página para visualizar e criar eventos",
        href: "/events",
      },
      {
        title: "Encartes",
        icon: LucideNewspaper,
        describe: "Página para visualizar e criar encartes",
        href: "/flyers",
      },
    ]
  }
  const items = [
    {
      title: "Dashboard",
      icon: LucideLayoutDashboard,
      describe: "Página principal da intranet",
      href: "/dashboard",
    },
    // {
    //   title: "Chat",
    //   icon: LucideMessageSquare,
    //   describe: "Chat interno para comunicação entre colaboradores",
    //   href: "/chat",
    // },
    {
      title: "Almoços",
      icon: LucideUtensils,
      describe: "Página para fazer pedidos de comida com restaurantes parceiros",
      href: "/food",
    },
    {
      title: "Salas",
      icon: LucideMapPin,
      describe: "Página para reservar salas na intranet",
      href: "/rooms",
    },
    {
      title: "Carros",
      icon: LucideCar,
      describe: "Página para reservar carros",
      href: "/cars",
    },
    {
      title: "Eventos",
      icon: LucideCalendar,
      describe: "Página para visualizar e criar eventos",
      href: "/events",
    },
    {
      title: "Encartes",
      icon: LucideNewspaper,
      describe: "Página para visualizar e criar encartes",
      href: "/flyers",
    },
    {
      title: "Shop",
      icon: LucideShoppingCart,
      describe: "Página para comprar itens personalizados com as logos da BOX e da Cristallux",
      href: "/shop",
    },
    {
      title: "Minhas Ideias",
      icon: LucideLightbulb,
      describe: "Visualizar e acompanhar o status das suas ideias enviadas",
      href: "/my-suggestions",
    },
    {
      title: "Formulários",
      icon: LucideFormInput,
      describe: "Página para requisitar processos internos para os setores, como marketing, TI, inovação e compras",
      href: "/forms",
    }
  ]
  
  // Verificar acesso admin usando role_config granular
  const hasAdminAccess = !!roleConfig?.sudo || (Array.isArray(roleConfig?.admin_pages) && roleConfig?.admin_pages.includes("/admin"));

  if (hasAdminAccess) {
    items.push({
      title: "Admin",
      icon: LucideTerminalSquare,
      describe: "Página de administração",
      href: "/admin",
    })
  }
  return items
}