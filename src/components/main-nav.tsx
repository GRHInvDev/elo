"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { LucideLink } from "lucide-react"

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Salas",
    href: "/rooms",
  },
  {
    title: "Eventos",
    href: "/events",
  },
  {
    title: "Encartes",
    href: "/flyers",
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <div className="flex items-center">
        <LucideLink className="size-5 -rotate-45"/>
        <h1 className="text-3xl font-bold">elo</h1>
      </div>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}

