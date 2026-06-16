"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useBreadcrumbs, type BreadcrumbEntry } from "@/contexts/breadcrumb-context"

/** Rótulos legíveis por segmento de rota. Segmentos ausentes caem no title-case. */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Home",
  // Reserva de recursos
  food: "Almoços",
  rooms: "Salas",
  cars: "Carros",
  // Anúncios
  birthdays: "Aniversariantes",
  events: "Eventos",
  news: "Notícias",
  flyers: "Encartes",
  // Formulários / Solicitações
  forms: "Solicitações",
  "my-suggestions": "Minhas Ideias",
  "my-responses": "Minhas solicitações",
  central: "Central de chamados",
  kanban: "Kanban",
  "emotion-ruler": "Régua de Emoções",
  "hall-entrada": "Hall de entrada",
  new: "Novo",
  edit: "Editar",
  respond: "Responder",
  responses: "Respostas",
  details: "Detalhes",
  rent: "Reservar",
  "my-rents": "Minhas reservas",
  // Outros
  shop: "Lojinha",
  extension: "Lista de ramais",
  quality: "Qualidade",
  chat: "Chat",
  "chat-groups": "Grupos de chat",
  doubts: "Dúvidas",
  lgpd: "LGPD",
  // Admin
  admin: "Admin",
  suggestions: "Ideias",
  users: "Usuários",
  products: "Produtos",
  vehicles: "Veículos",
  filiais: "Filiais",
  rooms_admin: "Salas",
  enums: "Enums",
}

/** Heurística para segmentos que são identificadores (cuid/uuid/numéricos). */
function isIdLike(segment: string): boolean {
  if (/^\d+$/.test(segment)) return true
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(segment)) return true // uuid
  if (/^c[a-z0-9]{20,}$/i.test(segment)) return true // cuid
  if (/^[a-z0-9]{20,}$/i.test(segment)) return true // ids longos
  return false
}

function titleCase(segment: string): string {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Deriva a trilha a partir do pathname quando a página não fornece uma própria. */
function deriveFromPathname(pathname: string): BreadcrumbEntry[] {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: BreadcrumbEntry[] = [{ label: "Home", href: "/dashboard" }]

  let href = ""
  for (const seg of segments) {
    href += `/${seg}`
    if (seg === "dashboard") continue // já representado por "Home"
    if (isIdLike(seg)) continue // não exibe ids crus na trilha derivada
    crumbs.push({ label: SEGMENT_LABELS[seg] ?? titleCase(seg), href })
  }

  return crumbs
}

export function HeaderBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname()
  const { items } = useBreadcrumbs()

  const crumbs = React.useMemo<BreadcrumbEntry[]>(
    () => items ?? deriveFromPathname(pathname ?? "/"),
    [items, pathname],
  )

  if (crumbs.length === 0) return null

  return (
    <Breadcrumb className={cn("overflow-hidden", className)}>
      <BreadcrumbList className="flex-nowrap overflow-hidden [&>li]:shrink-0 [&>li:last-child]:min-w-0">
        {crumbs.map((item, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage className="inline-flex min-w-0 items-center gap-1.5">
                    {index === 0 && <Home className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      {index === 0 && <Home className="h-3.5 w-3.5 shrink-0" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
