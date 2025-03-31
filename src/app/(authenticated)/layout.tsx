import type React from "react"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import FloatingChatButton from "@/components/ai/floating-chat-button"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="fixed flex h-16 items-center px-4 w-full z-50 bg-background/70 backdrop-blur-md">
          <MainNav />
          <div className="ml-4 flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 mt-16">{children}</main>
      <FloatingChatButton/>
    </div>
  )
}

