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

export function MainNav() {
  const pathname = usePathname()
  const { db_user } = useAccessControl()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Mobile navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen} >
          <DialogTitle className="hidden"/>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px] flex flex-col justify-between">
            <div className="flex flex-1 flex-col space-y-4 mt-8">
              {[...routeItems(db_user?.role_config)].map((item) => {if (item) return (
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
              )})}
            </div>
            <Separator />
            <SettingsMenu />
          </SheetContent>
        </Sheet>

        {/* Logo - visible on all screen sizes */}
        <div className="flex items-center">
          <LucideLink className="size-5 -rotate-45" />
          <h1 className="text-3xl font-bold hidden md:block">elo</h1>
        </div>
      </div>
    </>
  )
}