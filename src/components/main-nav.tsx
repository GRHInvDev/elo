"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { LucideLink, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SettingsMenu } from "./settings-menu"
import { Separator } from "./ui/separator"
import { routeItems } from "@/const/routes"
import { DialogTitle } from "./ui/dialog"
import { useAccessControl } from "@/hooks/use-access-control"

interface SidebarProps {
  className?: string
  collapsed?: boolean
}

export function Sidebar({ className, collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const { db_user } = useAccessControl()

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>

      {/* Logo */}
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center gap-2">
          <LucideLink className="size-6 -rotate-45" />
          {!collapsed && <h1 className="text-2xl font-bold">elo</h1>}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col space-y-1 p-4">
        {[...routeItems(db_user?.role_config)].map((item) => {
          if (item) return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted hover:text-primary",
                pathname === item.href
                  ? "text-primary bg-muted"
                  : "text-muted-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.describe : undefined}
            >
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Settings Menu */}
      <div className="p-4">
        <SettingsMenu size={collapsed ? "small" : undefined} />
      </div>
    </div>
  )
}

export function MainNav() {
  const pathname = usePathname()
  const { db_user } = useAccessControl()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <DialogTitle className="hidden"/>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Logo - visible only on mobile */}
      <div className="flex items-center md:hidden">
        <LucideLink className="size-5 -rotate-45" />
        <h1 className="text-3xl font-bold ml-2">elo</h1>
      </div>
    </>
  )
}