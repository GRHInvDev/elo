import { LucideCalendar, 
  LucideCar, 
  LucideFormInput, 
  LucideLayoutDashboard, 
  LucideMapPin, 
  LucideMessageSquare, 
  LucideNewspaper, 
  LucideShoppingCart, 
  LucideTerminalSquare, 
  LucideUtensils, 
  LucideLightbulb, 
  LucidePhone, 
  LucideMegaphone,
  SearchCheck,
  Book,
  FileText,
  LucideCake,
} from "lucide-react"
import { type RolesConfig } from "@/types/role-config"

export interface RouteItem {
  title: string
  icon: React.ElementType
  describe: string
  href?: string
  children?: RouteItem[]
}

export const routeItems = (roleConfig?: RolesConfig | null): RouteItem[] => {
  // Verificar se é um usuário TOTEM (apenas Dashboard, Eventos, Encartes, Aniversários)
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
      {
        title: "Aniversários",
        icon: LucideCake,
        describe: "Página para visualizar os aniversariantes do mês",
        href: "/birthdays",
      },
    ]
  }

  const items: RouteItem[] = [
    {
      title: "Dashboard",
      icon: LucideLayoutDashboard,
      describe: "Página principal da intranet",
      href: "/dashboard",
    },
    {
      title: "Reserva de Recursos",
      icon: SearchCheck,
      describe: "Reservas de almoços, salas e carros",
      children: [
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
      ],
    },
    {
      title: "Anúncios",
      icon: LucideMegaphone,
      describe: "Aniversariantes do Mês, Eventos, Encartes e Notícias",
      children: [
        {
          title: "Aniversariantes do Mês",
          icon: LucideCake,
          describe: "Página para visualizar os aniversariantes do mês",
          href: "/birthdays",
        },
        {
          title: "Eventos",
          icon: LucideCalendar,
          describe: "Página para visualizar e criar eventos",
          href: "/events",
        },
        {
          title: "Encartes",
          icon: Book,
          describe: "Página para visualizar e criar encartes",
          href: "/flyers",
        },
        {
          title: "Notícias",
          icon: LucideNewspaper,
          describe: "Página para visualizar notícias",
          href: "/news",
        },
      ],
    },
    {
      title: "Formulários",
      icon: FileText,
      describe: "Minhas ideias e solicitações",
      children: [
        {
          title: "Minhas Ideias",
          icon: LucideLightbulb,
          describe: "Visualizar e acompanhar o status das suas ideias enviadas",
          href: "/my-suggestions",
        },
        {
          title: "Solicitações",
          icon: LucideFormInput,
          describe: "Página para requisitar processos internos para os setores, como marketing, TI, inovação e compras",
          href: "/forms",
        },
      ],
    },
    {
      title: "Shop",
      icon: LucideShoppingCart,
      describe: "Página para comprar itens personalizados com as logos da BOX e da Cristallux",
      href: "/shop",
    },
    {
      title: "Lista de ramais",
      icon: LucidePhone,
      describe: "Lista de ramais telefônicos organizados por setor",
      href: "/extension",
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