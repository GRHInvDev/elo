"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { LucideLink, Menu } from "lucide-react"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MainNav() {
  const pathname = usePathname()
  const { data: user } = api.user.me.useQuery()
  const [isOpen, setIsOpen] = useState(false)

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
    {
      title: "Carros",
      href: "/cars",
    },
    {
      title: "Shop",
      href: "/shop",
    },
  ]

  if (user?.role === "ADMIN") {
    items.push({
      title: "Admin",
      href: "/admin",
    })
  }

  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo - visible on all screen sizes */}
      <div className="flex items-center">
        <LucideLink className="size-5 -rotate-45" />
        <h1 className="text-3xl font-bold">elo</h1>
      </div>

      {/* Desktop navigation - hidden on mobile */}
      <nav className="hidden md:flex items-center space-x-6">
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

      {/* Mobile navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[240px] sm:w-[300px]">
          <div className="flex flex-col space-y-4 mt-8">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-base font-medium transition-colors hover:text-primary p-2 rounded-md",
                  pathname === item.href ? "text-primary bg-muted" : "text-muted-foreground",
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}