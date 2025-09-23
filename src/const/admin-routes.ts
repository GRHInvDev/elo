import { Shield, Users, Cake, Utensils, MapPin, Lightbulb, Car, Newspaper, MessageSquare } from "lucide-react"

export interface AdminRoute {
  id: string
  title: string
  description: string
  icon: React.ElementType
  path: string
  requiresBasicAdmin: boolean // Se precisa do /admin básico
}

export const ADMIN_ROUTES: AdminRoute[] = [
  {
    id: "/admin",
    title: "Painel Admin",
    description: "Acesso básico ao painel administrativo",
    icon: Shield,
    path: "/admin",
    requiresBasicAdmin: false, // Esta é a rota base
  },
  {
    id: "/admin/users",
    title: "Gerenciar Usuários",
    description: "Gerenciar usuários, permissões e configurações",
    icon: Users,
    path: "/admin/users",
    requiresBasicAdmin: true,
  },
  {
    id: "/admin/birthday",
    title: "Gerenciar Aniversários",
    description: "Configurar e gerenciar aniversários",
    icon: Cake,
    path: "/admin/birthday",
    requiresBasicAdmin: true,
  },
  {
    id: "/admin/food",
    title: "Gerenciar Alimentação",
    description: "Gerenciar restaurantes, cardápios e pedidos",
    icon: Utensils,
    path: "/admin/food",
    requiresBasicAdmin: true,
  },
  {
    id: "/admin/rooms",
    title: "Gerenciar Salas",
    description: "Configurar salas e gerenciar reservas",
    icon: MapPin,
    path: "/admin/rooms",
    requiresBasicAdmin: true,
  },
  {
    id: "/admin/news",
    title: "Gerenciar News",
    description: "Publicar e gerenciar notícias e comunicados",
    icon: Newspaper,
    path: "/admin/news",
    requiresBasicAdmin: true,
  },
  {
    id: "/admin/suggestions",
    title: "Gerenciar Ideias",
    description: "Analisar e gerenciar sugestões dos usuários",
    icon: Lightbulb,
    path: "/admin/suggestions",
    requiresBasicAdmin: true,
  },
  {
    id: "/admin/vehicles",
    title: "Gerenciar Veículos",
    description: "Gerenciar frota de veículos, reservas e métricas de uso",
    icon: Car,
    path: "/admin/vehicles",
    requiresBasicAdmin: true,
  },
  {
    id: "/admin/chat",
    title: "Gerenciar Chat",
    description: "Gerenciar sistema de chat, grupos e configurações",
    icon: MessageSquare,
    path: "/admin/chat",
    requiresBasicAdmin: true,
  },
  {
    id: "/admin/chat-groups",
    title: "Gerenciar Grupos Chat",
    description: "Gerenciar grupos de chat e controle de membros",
    icon: MessageSquare,
    path: "/admin/chat-groups",
    requiresBasicAdmin: true,
  },
]

export function getAdminRouteById(id: string): AdminRoute | undefined {
  return ADMIN_ROUTES.find(route => route.id === id)
}

export function getAccessibleAdminRoutes(adminPages: string[]): AdminRoute[] {
  // Se não tem acesso ao /admin básico, não pode acessar nada
  if (!adminPages.includes("/admin")) {
    return []
  }

  // Retorna as rotas que o usuário tem acesso
  return ADMIN_ROUTES.filter(route => {
    if (route.id === "/admin") return true // Sempre incluir a rota base
    return adminPages.includes(route.id)
  })
}

export function hasAccessToAdminRoute(adminPages: string[], routeId: string): boolean {
  // Se não tem acesso ao /admin básico, não pode acessar nada
  if (!adminPages.includes("/admin")) {
    return false
  }

  // Se é a rota base, já tem acesso
  if (routeId === "/admin") {
    return true
  }

  // Verificar se tem acesso à rota específica
  return adminPages.includes(routeId)
}
