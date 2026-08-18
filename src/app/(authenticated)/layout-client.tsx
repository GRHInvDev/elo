"use client"

import type React from "react"
import { useState } from "react"
import { MainNav, Sidebar } from "@/components/ui/main-nav"
import { UserNav } from "@/components/ui/user-nav"
import { AppReleaseNotesDialog } from "@/components/ui/app-release-notes-dialog"
import { SettingsMenu } from "@/components/ui/settings-menu"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { AnimationProvider } from "@/contexts/animation-context"
import { BirthdayConfettiWrapper } from "@/components/birthday/birthday-confetti-wrapper"
import FloatingChatButton from "@/components/ai/floating-chat-button"
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context"
import { HeaderBreadcrumb } from "@/components/ui/header-breadcrumb"

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
      <BreadcrumbProvider>
      <div className="flex min-h-screen">
        {/* Sidebar - hidden on mobile, visible on desktop */}
        <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 print:hidden ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'
          }`}>
          <Sidebar collapsed={sidebarCollapsed} />
        </aside>

        {/* Main content area */}
        <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
          }`}>
          {/* Top header - only visible on mobile */}
          <header className="flex h-16 items-center gap-4 border-b bg-background/70 backdrop-blur-xl px-4 md:hidden print:hidden">
            <MainNav />
            <div className="ml-auto flex items-center gap-1">
              <AppReleaseNotesDialog size="small" />
              <SettingsMenu size="small" />
              <UserNav />
            </div>
          </header>

          {/* Top header for desktop - compact version */}
          <header className="hidden md:flex h-16 items-center justify-between border-b bg-background/70 backdrop-blur-xl px-6 print:hidden">
            <div className="flex min-w-0 items-center">
              {/* Botão para abrir o sidebar */}
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0 shrink-0" onClick={toggleSidebar}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">{sidebarCollapsed ? 'Expandir sidebar' : 'Reduzir sidebar'}</span>
              </Button>
              <HeaderBreadcrumb className="ml-8 min-w-0" />
            </div>
            <div className="flex items-center gap-3">
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
      </div>
      <AnimatedBackground />
      <div className="print:hidden">
        <BirthdayConfettiWrapper />
      </div>
      <div className="print:hidden">
        <FloatingChatButton />
      </div>
      </BreadcrumbProvider>
    </AnimationProvider>
  )
}
