import { LucideCalendar, LucideCar, LucideFormInput, LucideLayoutDashboard, LucideMapPin, LucideNewspaper, LucideShoppingCart } from "lucide-react"

export const routeItems = [
    {
      title: "Dashboard",
      icon: LucideLayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "Salas",
      icon: LucideMapPin,
      href: "/rooms",
    },
    {
      title: "Eventos",
      icon: LucideCalendar,
      href: "/events",
    },
    {
      title: "Encartes",
      icon: LucideNewspaper,
      href: "/flyers",
    },
    {
      title: "Carros",
      icon: LucideCar,
      href: "/cars",
    },
    {
      title: "Shop",
      icon: LucideShoppingCart,
      href: "/shop",
    },
    {
      title: "Formulários",
      icon: LucideFormInput,
      href: "/forms",
    }
  ]