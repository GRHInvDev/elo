import { LucideCalendar, LucideCar, LucideFormInput, LucideLayoutDashboard, LucideMapPin, LucideNewspaper, LucideShoppingCart } from "lucide-react"

export const routeItems = [
    {
      title: "Dashboard",
      icon: LucideLayoutDashboard,
      describe: "Página principal da intranet",
      href: "/dashboard",
    },
    {
      title: "Salas",
      icon: LucideMapPin,
      describe: "Página para reservar salas na intranet",
      href: "/rooms",
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
      title: "Carros",
      icon: LucideCar,
      describe: "Página para reservar carros",
      href: "/cars",
    },
    {
      title: "Shop",
      icon: LucideShoppingCart,
      describe: "Página para comprar itens personalizados com as logos da BOX e da Cristallux",
      href: "/shop",
    },
    {
      title: "Formulários",
      icon: LucideFormInput,
      describe: "Página para requisitar processos internos para os setores, como marketing, TI, inovação e compras",
      href: "/forms",
    }
  ]