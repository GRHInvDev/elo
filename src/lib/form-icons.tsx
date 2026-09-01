"use client"

import {
  Laptop,
  Monitor,
  Smartphone,
  Server,
  Wifi,
  Terminal,
  Cpu,
  Database,
  Wrench,
  Hammer,
  Paintbrush,
  HardHat,
  Truck,
  Car,
  UserCheck,
  Users,
  UserPlus,
  GraduationCap,
  Award,
  Smile,
  HeartHandshake,
  Stethoscope,
  CreditCard,
  DollarSign,
  Coins,
  Receipt,
  Scale,
  FileText,
  FileSpreadsheet,
  FileCheck,
  ShoppingCart,
  Package,
  Boxes,
  Store,
  ShoppingBag,
  Tag,
  Barcode,
  Megaphone,
  Sparkles,
  Flame,
  Target,
  Presentation,
  Send,
  Share2,
  ShieldCheck,
  Lock,
  Key,
  Eye,
  Fingerprint,
  Calendar,
  Clock,
  Compass,
  MapPin,
  Building,
  Building2,
  Warehouse,
  Factory,
  Headphones,
  MessageSquare,
  Phone,
  Mail,
  HelpCircle,
  Zap,
  Settings,
  Activity,
  Briefcase,
  Layers,
  Inbox,
  FolderLock,
  type LucideIcon,
} from "lucide-react"

export interface FormIconDefinition {
  id: string
  label: string
  icon: LucideIcon
}

export const FORM_ICONS: FormIconDefinition[] = [
  { id: "laptop", label: "Notebook", icon: Laptop },
  { id: "monitor", label: "Monitor", icon: Monitor },
  { id: "smartphone", label: "Smartphone", icon: Smartphone },
  { id: "server", label: "Servidor", icon: Server },
  { id: "wifi", label: "Rede & Wi-Fi", icon: Wifi },
  { id: "terminal", label: "Terminal / Código", icon: Terminal },
  { id: "cpu", label: "Hardware & CPU", icon: Cpu },
  { id: "database", label: "Banco de Dados", icon: Database },

  { id: "wrench", label: "Ferramenta", icon: Wrench },
  { id: "hammer", label: "Construção & Martelo", icon: Hammer },
  { id: "paintbrush", label: "Pintura & Acabamento", icon: Paintbrush },
  { id: "hardhat", label: "Capacete & Obras", icon: HardHat },
  { id: "truck", label: "Caminhão & Frotas", icon: Truck },
  { id: "car", label: "Carro & Veículos", icon: Car },

  { id: "user-check", label: "Validação de Usuário", icon: UserCheck },
  { id: "users", label: "Equipe & Colaboradores", icon: Users },
  { id: "user-plus", label: "Admissão & Novo Colaborador", icon: UserPlus },
  { id: "graduation-cap", label: "Treinamentos", icon: GraduationCap },
  { id: "award", label: "Reconhecimento & Prêmio", icon: Award },
  { id: "smile", label: "Satisfação & Clima", icon: Smile },
  { id: "hearthandshake", label: "Benefícios & Parcerias", icon: HeartHandshake },
  { id: "stethoscope", label: "Saúde & Medicina do Trabalho", icon: Stethoscope },

  { id: "credit-card", label: "Cartão & Contas", icon: CreditCard },
  { id: "dollar-sign", label: "Dinheiro & Pagamento", icon: DollarSign },
  { id: "coins", label: "Moedas & Caixa", icon: Coins },
  { id: "receipt", label: "Nota Fiscal & Recibo", icon: Receipt },
  { id: "scale", label: "Jurídico & Compliance", icon: Scale },
  { id: "file-text", label: "Documentos", icon: FileText },
  { id: "file-spreadsheet", label: "Planilhas", icon: FileSpreadsheet },
  { id: "file-check", label: "Contratos Aprovados", icon: FileCheck },
  { id: "shopping-cart", label: "Carrinho de Compras", icon: ShoppingCart },
  { id: "package", label: "Pacote & Encomenda", icon: Package },
  { id: "boxes", label: "Estoque & Almoxarifado", icon: Boxes },
  { id: "store", label: "Loja & Comercial", icon: Store },
  { id: "shopping-bag", label: "Sacola & Pedidos", icon: ShoppingBag },
  { id: "tag", label: "Etiqueta", icon: Tag },
  { id: "barcode", label: "Código de Barras", icon: Barcode },

  { id: "megaphone", label: "Megafone & Comunicação", icon: Megaphone },
  { id: "sparkles", label: "Inovação & Ideias", icon: Sparkles },
  { id: "flame", label: "Destaque & Prioridade", icon: Flame },
  { id: "target", label: "Metas & Objetivos", icon: Target },
  { id: "presentation", label: "Apresentação", icon: Presentation },
  { id: "send", label: "Envio & Mensagens", icon: Send },
  { id: "share2", label: "Compartilhamento", icon: Share2 },

  { id: "shield-check", label: "Segurança & Proteção", icon: ShieldCheck },
  { id: "lock", label: "Cadeado & Restrição", icon: Lock },
  { id: "key", label: "Chave & Acessos", icon: Key },
  { id: "eye", label: "Vigilância & Monitoramento", icon: Eye },
  { id: "folder-lock", label: "Pasta Protegida", icon: FolderLock },
  { id: "fingerprint", label: "Biometria & Portaria", icon: Fingerprint },

  { id: "calendar", label: "Calendário & Agendas", icon: Calendar },
  { id: "clock", label: "Horários & Ponto", icon: Clock },
  { id: "compass", label: "Navegação & Direção", icon: Compass },
  { id: "map-pin", label: "Localização", icon: MapPin },
  { id: "building", label: "Edifício", icon: Building },
  { id: "building2", label: "Sede Corporativa", icon: Building2 },
  { id: "warehouse", label: "Galpão", icon: Warehouse },
  { id: "factory", label: "Fábrica & Produção", icon: Factory },
  { id: "headphones", label: "Atendimento ao Cliente", icon: Headphones },
  { id: "message-square", label: "Chat & Mensagens", icon: MessageSquare },
  { id: "phone", label: "Telefone & Ramal", icon: Phone },
  { id: "mail", label: "Email Corporativo", icon: Mail },
  { id: "briefcase", label: "Administrativo", icon: Briefcase },
  { id: "layers", label: "Camadas & Processos", icon: Layers },
  { id: "inbox", label: "Caixa de Entrada", icon: Inbox },
  { id: "zap", label: "Urgências", icon: Zap },
  { id: "settings", label: "Configurações", icon: Settings },
  { id: "activity", label: "Monitoramento & Status", icon: Activity },
  { id: "help-circle", label: "Suporte Geral", icon: HelpCircle },
]

export const SECTOR_PRESET_COLORS = [
  "#2563EB", // Azul
  "#06B6D4", // Ciano
  "#0D9488", // Teal
  "#10B981", // Esmeralda
  "#22C55E", // Verde
  "#84CC16", // Lima
  "#EAB308", // Amarelo
  "#F59E0B", // Âmbar
  "#F97316", // Laranja
  "#EA580C", // Laranja Escuro
  "#DC2626", // Vermelho
  "#EF4444", // Vermelho Claro
  "#F43F5E", // Rose
  "#E11D48", // Cereja
  "#EC4899", // Rosa
  "#DB2777", // Magenta
  "#D946EF", // Fúcsia
  "#A855F7", // Violeta
  "#8B5CF6", // Roxo
  "#7C3AED", // Roxo Escuro
  "#6366F1", // Índigo
  "#4F46E5", // Índigo Escuro
  "#4338CA", // Azul Violeta
  "#0284C7", // Azul Céu
  "#0EA5E9", // Azul Claro
  "#38BDF8", // Azul Celeste
  "#14B8A6", // Turquesa
  "#2DD4BF", // Menta
  "#65A30D", // Verde Oliva
  "#4D7C0F", // Verde Musgo
  "#92400E", // Marrom Âmbar
  "#9A4824", // Terracota
  "#B45309", // Bronze
  "#64748B", // Slate
  "#475569"  // Cinza Azulado
]

const ICON_MAP = new Map<string, LucideIcon>(FORM_ICONS.map((item) => [item.id, item.icon]))

export function getLucideIconById(iconId: string | null | undefined): LucideIcon {
  if (iconId && ICON_MAP.has(iconId)) {
    return ICON_MAP.get(iconId)!
  }
  return HelpCircle
}

export interface SectorVisualInfo {
  icon: LucideIcon
  color: string
}

/**
 * Retorna as informações visuais (ícone Lucide e cor HEX) para um determinado setor.
 * Verifica primeiro no mapa de setores configurado no banco. Se não encontrar, faz fallback inteligente.
 */
export function getSectorVisualInfo(
  sectorName: string | null | undefined,
  sectorConfigs?: Record<string, { icon: string; color: string }> | null,
): SectorVisualInfo {
  const name = (sectorName ?? "Geral").trim()

  const config = sectorConfigs?.[name]
  if (config) {
    return {
      icon: getLucideIconById(config.icon),
      color: config.color || "#3B82F6",
    }
  }

  // 2. Fallbacks
  const text = name.toLowerCase()

  if (text.includes("ti") || text.includes("informática") || text.includes("tecnologia") || text.includes("sistema")) {
    return { icon: Laptop, color: "#3B82F6" }
  }
  if (text.includes("rh") || text.includes("humano") || text.includes("pessoal") || text.includes("gente")) {
    return { icon: UserCheck, color: "#F43F5E" }
  }
  if (text.includes("manuten") || text.includes("obra") || text.includes("predial") || text.includes("infra")) {
    return { icon: Wrench, color: "#F59E0B" }
  }
  if (text.includes("financ") || text.includes("contas") || text.includes("fiscal") || text.includes("controladoria")) {
    return { icon: CreditCard, color: "#10B981" }
  }
  if (text.includes("compra") || text.includes("suprimento") || text.includes("almoxarifado") || text.includes("estoque")) {
    return { icon: ShoppingCart, color: "#F97316" }
  }
  if (text.includes("logística") || text.includes("frota") || text.includes("transporte") || text.includes("veículo")) {
    return { icon: Truck, color: "#06B6D4" }
  }
  if (text.includes("seguran") || text.includes("portaria") || text.includes("acesso") || text.includes("compliance")) {
    return { icon: ShieldCheck, color: "#6366F1" }
  }
  if (text.includes("market") || text.includes("comunicação") || text.includes("evento") || text.includes("design")) {
    return { icon: Megaphone, color: "#8B5CF6" }
  }
  if (text.includes("qualidade") || text.includes("processo")) {
    return { icon: Target, color: "#14B8A6" }
  }
  if (text.includes("juríd") || text.includes("contrato")) {
    return { icon: Scale, color: "#64748B" }
  }

  return { icon: HelpCircle, color: "#3B82F6" }
}
