import type React from "react"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import FloatingChatButton from "@/components/ai/floating-chat-button"
import { routeItems } from "@/const/routes"
import Link from "next/link"
import { CartProvider } from "@/contexts/cart-context"

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
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="fixed flex md flex-col h-12 md:h-32 pt-2 md:pt-4 items-center px-4 w-full z-50 bg-background/70 backdrop-blur-md">
            <div className="flex w-full justify-around">
              <MainNav />
              <h1 className="min-w-fit flex-1 text-center justify-center font-extralight align-middle flex items-center">
                Grupo R Henz
              </h1>
              <div className="ml-4 flex items-center space-x-4">
                <UserNav />
              </div>
            </div>
            <div className="hidden md:flex w-full justify-around p-4 mt-4">
              {routeItems.map((r, i) => (
                <Link
                  key={i}
                  href={r.href}
                  className="flex items-center gap-2 font-extralight"
                >
                  <r.icon className="size-4" />
                  {r.title}
                </Link>
              ))}
            </div>
          </div>
        </header>
        <main className="flex-1 md:mt-32 mt-16">{children}</main>
        <FloatingChatButton />
      </div>
    </CartProvider>
  )
}

