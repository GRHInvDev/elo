"use client"

import type React from "react"
import { useState } from "react"
import { MainNav, Sidebar } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import FloatingChatButton from "@/components/ai/floating-chat-button"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { AnimatedBackground } from "@/components/animated-background"
import { AnimationProvider } from "@/contexts/animation-context"

export default function AuthenticatedLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
      <AnimationProvider>
    <div className="flex min-h-screen">
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ${
        sidebarCollapsed ? 'md:w-16' : 'md:w-64'
      }`}>
        <Sidebar collapsed={sidebarCollapsed} />
      </aside>

      {/* Main content area */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        {/* Top header - only visible on mobile */}
        <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </header>

        {/* Top header for desktop - compact version */}
        <header className="hidden md:flex h-16 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center">
            {/* Botão para abrir o sidebar */}
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">{sidebarCollapsed ? 'Expandir sidebar' : 'Reduzir sidebar'}</span>
            </Button>
            <h2 className="text-lg ml-8 font-semibold">Grupo R Henz</h2>
          </div>
          <div className="flex items-center space-x-4">
            <UserNav />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>

      <FloatingChatButton/>
    </div>
      <AnimatedBackground/>
      </AnimationProvider>
  )
}
