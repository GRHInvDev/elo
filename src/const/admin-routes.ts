import {
  Shield, Users, Cake, Utensils, MapPin, Lightbulb, Car, Newspaper, ShoppingBag, FileCheck
  // ,Heart 
} from "lucide-react"

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
    id: "/admin/products",
    title: "Gerenciar Produtos",
    description: "Criar, editar e gerenciar produtos da loja",
    icon: ShoppingBag,
    path: "/admin/products",
    requiresBasicAdmin: true,
  },
  {
    id: "/admin/quality",
    title: "Gestão de Qualidade",
    description: "Lista Mestra de Documentos",
    icon: FileCheck,
    path: "/admin/quality",
    requiresBasicAdmin: true,
  },
  // {
  //   id: "/admin/emotion-ruler",
  //   title: "Régua de Emoções",
  //   description: "Gerenciar régua de emoções e acompanhar respostas",
  //   icon: Heart,
  //   path: "/admin/emotion-ruler",
  //   requiresBasicAdmin: true,
  // },
  // {
  //   id: "/admin/chat",
  //   title: "Gerenciar Chat",
  //   description: "Gerenciar sistema de chat, grupos e configurações",
  //   icon: MessageSquare,
  //   path: "/admin/chat",
  //   requiresBasicAdmin: true,
  // },
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

export function hasAccessToAdminRoute(adminPages: string[], routeId: string, canManageProducts?: boolean, canManageQuality?: boolean, canManageEmotionRules?: boolean): boolean {
  // Se é a rota base, verificar se tem qualquer acesso admin
  if (routeId === "/admin") {
    // Tem acesso se tem /admin na lista OU tem qualquer rota que comece com /admin
    return adminPages.includes("/admin") || adminPages.some(route => route.startsWith("/admin"))
  }

  // Para /admin/products, verificar também can_manage_produtos se fornecido
  if (routeId === "/admin/products" && canManageProducts === true) {
    return true
  }

  // Para /admin/quality, verificar também can_manage_quality_management se fornecido
  if (routeId === "/admin/quality" && canManageQuality === true) {
    return true
  }

  // Para /admin/emotion-ruler, verificar também can_manage_emotion_rules se fornecido
  if (routeId === "/admin/emotion-ruler" && canManageEmotionRules === true) {
    return true
  }

  // Se não tem acesso ao /admin básico, não pode acessar outras rotas
  // EXCETO se tem a rota específica e permissão específica
  if (!adminPages.includes("/admin")) {
    // Permitir se tem can_manage_produtos e a rota é /admin/products
    if (routeId === "/admin/products" && canManageProducts === true) {
      return true
    }
    // Permitir se tem can_manage_quality_management e a rota é /admin/quality
    if (routeId === "/admin/quality" && canManageQuality === true) {
      return true
    }
    // Permitir se tem can_manage_emotion_rules e a rota é /admin/emotion-ruler
    if (routeId === "/admin/emotion-ruler" && canManageEmotionRules === true) {
      return true
    }
    return false
  }

  // Verificar se tem acesso à rota específica
  return adminPages.includes(routeId)
}
