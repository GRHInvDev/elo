import type React from "react"

import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import FloatingChatButton from "@/components/ai/floating-chat-button"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { routeItems } from "@/const/routes"
import Link from "next/link"
import { api } from "@/trpc/server"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Usar a API simplificada com tratamento de erro para usuários Totem
  let user;
  
  try {
    user = await api.user.me();
  } catch (error) {
    console.error('[AuthenticatedLayout] Erro ao obter usuário:', error);
    
    // Em caso de erro, retornar um usuário padrão com configuração Totem
    // Isso evita crashes e permite que o layout seja renderizado
    user = {
      id: 'fallback-user',
      email: 'fallback@totem.local',
      firstName: null,
      lastName: null,
      imageUrl: null,
      enterprise: null,
      setor: null,
      birthDay: null,
      role_config: {
        sudo: false,
        admin_pages: [],
        can_create_form: false,
        can_create_event: false,
        can_create_flyer: false,
        can_create_booking: false,
        can_locate_cars: false,
        isTotem: true
      }
    };
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="fixed flex md flex-col h-12 md:h-32 pt-2 md:pt-4 items-center px-4 w-full z-50 bg-background/70 backdrop-blur-md">
          <div className="flex w-full justify-around">
            <MainNav />
            <h1 className="min-w-fit flex-1 text-center justify-center font-extralight align-middle flex items-center">
              Grupo R Henz
            </h1>
            <div className="ml-4 flex items-center space-x-4">
              <NotificationDropdown />
              <UserNav />
            </div>
          </div>
          <div className="hidden md:flex w-full justify-around p-4 mt-4">
            {routeItems(user?.role_config).map((r, i)=>(
              <Link key={i} href={r.href} title={r.title} className="flex items-center gap-2 font-extralight">
                <r.icon className="size-4"/>
                <p className="hidden lg:block">{r.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </header>
      <main className="flex-1 md:mt-32 mt-16">{children}      </main>
      <FloatingChatButton/>
    </div>
  )
}

