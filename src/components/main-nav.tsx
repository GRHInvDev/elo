"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { LucideCalendar, LucideCar, LucideFormInput, LucideLayoutDashboard, LucideLink, LucideMapPin, LucideNewspaper, LucideShoppingCart, LucideTerminalSquare, Menu } from "lucide-react"
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

  if (user?.role === "ADMIN") {
    items.push({
      title: "Admin",
      icon: LucideTerminalSquare,
      href: "/admin",
    })
  }

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Mobile navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen} >
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <div className="flex flex-col space-y-4 mt-8">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-base font-medium flex items-center transition-colors hover:text-primary p-2 rounded-md",
                  pathname === item.href ? "text-primary bg-muted" : "text-muted-foreground",
                )}
              >
                <item.icon className="mr-2 size-4"/>
                {item.title}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Logo - visible on all screen sizes */}
      <div className="flex items-center">
        <LucideLink className="size-5 -rotate-45" />
        <h1 className="text-3xl font-bold">elo</h1>
      </div>
    </div>
  )
}