"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { LucideLink, Menu, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SettingsMenu } from "@/components/ui/settings-menu"
import { Separator } from "./separator"
import { routeItems, type RouteItem } from "@/const/routes"
import { DialogTitle } from "./dialog"
import { useAccessControl } from "@/hooks/use-access-control"
import { api } from "@/trpc/react"

interface SidebarProps {
  className?: string
  collapsed?: boolean
  onLinkClick?: () => void
}

export function Sidebar({ className, collapsed = false, onLinkClick }: SidebarProps) {
  const pathname = usePathname()
  const { db_user } = useAccessControl()
  const { data: isOwnerOfAnyForm = false } = api.form.isOwnerOfAnyForm.useQuery()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(title)) {
        newSet.delete(title)
      } else {
        newSet.add(title)
      }
      return newSet
    })
  }

  const isGroupExpanded = (title: string) => expandedGroups.has(title)

  // Auto-expand groups containing the current route
  useEffect(() => {
    const routes = routeItems(db_user?.role_config, isOwnerOfAnyForm, db_user?.novidades)
    const groupsToExpand = new Set<string>()

    const findActiveGroups = (items: RouteItem[]) => {
      for (const item of items) {
        if (item.children) {
          // Check if any child or grandchild matches the current pathname
          const hasActiveChild = item.children.some(child =>
            child.href === pathname ||
            child.children?.some(grandChild => grandChild.href === pathname)
          )

          if (hasActiveChild) {
            groupsToExpand.add(item.title)
          }

          // Recursively check children for nested groups
          findActiveGroups(item.children)
        }
      }
    }

    findActiveGroups(routes)
    setExpandedGroups(prev => new Set([...prev, ...groupsToExpand]))
  }, [pathname, db_user?.role_config, isOwnerOfAnyForm, db_user?.novidades === true])

  const renderNavItem = (item: RouteItem, level = 0): JSX.Element | null => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = isGroupExpanded(item.title)
    const href = item.href
    const isActive = href ? pathname === href : false
    const hasActiveChild = hasChildren && item.children?.some(child =>
      child.href === pathname || child.children?.some(grandChild => grandChild.href === pathname)
    )

    if (hasChildren) {
      // Render group item
      return (
        <div key={item.title} className="space-y-1">
          <button
            onClick={() => toggleGroup(item.title)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted hover:text-primary",
              hasActiveChild && "text-primary bg-muted",
              collapsed && "justify-center px-2",
              level > 0 && "ml-4"
            )}
            title={collapsed ? item.describe : undefined}
          >
            <div className="flex items-center gap-3">
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </div>
            {!collapsed && (
              <div className="ml-auto transition-transform duration-200">
                <ChevronRight className={cn(
                  "size-4 transition-transform duration-200",
                  isExpanded && "rotate-90"
                )} />
              </div>
            )}
          </button>

          {/* Render children with smooth animation */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out ml-4",
              isExpanded && !collapsed ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="space-y-1 py-1">
              {item.children?.map(child => renderNavItem(child, level + 1))}
            </div>
          </div>
        </div>
      )
    } else if (href) {
      // Render regular link item
      return (
        <Link
          key={href}
          href={href}
          onClick={() => {
            // Fechar sidebar no mobile ao clicar em um link
            if (onLinkClick) {
              onLinkClick()
            }
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted hover:text-primary",
            isActive
              ? "text-primary bg-muted"
              : "text-muted-foreground",
            collapsed && "justify-center px-2",
            level > 0 && "ml-4"
          )}
          title={collapsed ? item.describe : undefined}
        >
          <item.icon className="size-5 shrink-0" />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </Link>
      )
    }

    return null
  }

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
      <nav className="flex-1 flex flex-col space-y-1 p-4 overflow-y-auto">
        {routeItems(db_user?.role_config, isOwnerOfAnyForm, db_user?.novidades).map((item) => renderNavItem(item))}
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
  const [isOpen, setIsOpen] = useState(false)

  const handleCloseSidebar = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <DialogTitle className="hidden" />
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0">
          <Sidebar onLinkClick={handleCloseSidebar} />
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