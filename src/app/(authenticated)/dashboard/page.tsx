"use client"

import { MainCarousel } from "@/components/dashboard/main-carousel"
import { BirthdaysCarousel } from "@/components/dashboard/birthdays-carousel"
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import { LinkIcon, LucideGraduationCap } from "lucide-react"
import { VideosCarousel } from "@/components/dashboard/videos-carousel"
import Link from "next/link"
import { NewsDisplay } from "@/components/dashboard/news-displ"
import { routeItems } from "@/const/routes"
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa6"
import Image from "next/image"
import { DashboardShell } from "@/components/dashboard-shell"
import { Separator } from "@/components/ui/separator"

import { SuggestionsWrapper } from "./suggestions-wrapper"
import { CompleteProfileModal } from "@/components/complete-profile-modal"
import { WelcomeCard } from "@/components/dashboard/welcome-card"
import { useState, useEffect, useMemo } from "react"

export default function DashboardPage() {
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Buscar dados usando client-side tRPC
  const { data: birthdays } = api.birthday.listCurrentMonth.useQuery()
  const { data: user, refetch: refetchUser } = api.user.me.useQuery()

  // Tipagem para os dados do usuário
  // Removido: userRole não é mais necessário com novo sistema
  const userEnterprise = user?.enterprise ?? null
  const userSetor = user?.setor ?? null
  const isTotem = user?.role_config?.isTotem === true

  // Verificar se os campos obrigatórios estão preenchidos
  useEffect(() => {
    if (user && (!userEnterprise || !userSetor)) {
      setShowProfileModal(true)
    }
  }, [user, userEnterprise, userSetor])

  const todayBirthdays = useMemo(() => {
    if (!birthdays) {
      return []
    }

    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()

    return birthdays.filter((birthday) => {
      const birthdayDate = new Date(birthday.data)
      return (
        birthdayDate.getDate() === currentDay &&
        birthdayDate.getMonth() === currentMonth
      )
    })
  }, [birthdays])

  const hasTodayBirthdays = todayBirthdays.length > 0

  const posts: {
    imageRef: string,
    title: string,
  }[] = [
    {
      imageRef: '/banners/Banners-intranet-1.png',
      title: 'Banners-intranet-1',
    },
    {
      imageRef: '/banners/Banners-intranet-2.png',
      title: 'Banners-intranet-2',
    },
    {
      imageRef: '/banners/Banners-intranet-4.png',
      title: 'Banners-intranet-4',
    },
    {
      imageRef: '/banners/Banners-intranet-6.jpg',
      title: 'Banners-intranet-6',
    },
  ]

  const videos: {
    imageRef: string,
    title: string,
  }[] = [
    {
      imageRef: 'https://www.youtube.com/embed/AIlQ-EM35UQ?si=RomGdNhQLn6CuzCw',
      title: 'Institucional Cristallux',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Card de Boas-vindas para novos colaboradores */}
      <div className="w-full max-w-6xl mx-auto px-4 pt-6 pb-4">
        <WelcomeCard />
      </div>

      {/* Seção Principal - Banners e Aniversários */}
      <div className={cn("grid grid-cols-1 md:grid-cols-3", !hasTodayBirthdays && "md:grid-cols-1")}>
        {
          posts.length > 0 &&
          <MainCarousel className={cn("w-full max-w-6xl md:max-w-[1920px] mx-auto px-4 md:px-4 lg:px-8 md:col-span-2", !hasTodayBirthdays && "md:col-span-1")} itens={posts}/>
        }
        {
          hasTodayBirthdays && (
            <BirthdaysCarousel className="w-full md:col-span-1" itens={todayBirthdays.map((b)=>({
              imageRef: b.imageUrl ?? "",
              title: b.name
            }))}/>
          )
        }
    </div>
    <div className="w-full max-w-6xl md:max-w-[1920px] mx-auto px-4 md:px-4 lg:px-8 mt-6 md:mt-8 space-y-4 md:space-y-6">
            {/* Funcionalidades Mobile */}
            <div className="md:hidden">
              <h1 className="text-2xl md:text-4xl mb-4 md:mb-6 font-semibold">
                Funcionalidades
              </h1>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {
                  routeItems(user?.role_config).map((m,i)=> m.title !== "Dashboard" && m.href && (
                    <div key={i} className="col-span-1">
                      <Link href={m.href} className="hover:bg-primary/30 transition-all justify-center flex items-center bg-muted p-3 rounded-lg gap-x-2 text-sm">
                        <m.icon className="size-4"/>
                        <span className="text-center leading-tight">{m.title}</span>
                      </Link>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
      {/* Links Úteis e Ideias - Dividido em duas colunas */}
      <div className="w-full max-w-6xl md:max-w-[1920px] mx-auto px-4 md:px-4 lg:px-8 mt-4 md:mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Links Úteis - Desktop: lado a lado, Mobile: Sites primeiro, depois Treinamento */}
          <div className="bg-muted rounded-lg p-3 md:p-4">
            <div className="flex gap-2 items-center text-sm md:text-base font-semibold mb-3">
              <LinkIcon className="size-4 md:size-5"/>
              <span>Links Úteis</span>
            </div>
            
            {/* Mobile: Sites primeiro, Divisor, Treinamento */}
            <div className="md:hidden space-y-3">
              {/* Sites */}
              <div>
                <h4 className="text-xs font-medium mb-2 text-muted-foreground">Sites</h4>
                <div className="space-y-1.5">
                  <Link 
                    href={'https://boxdistribuidor.com.br'} 
                    className="flex items-center rounded-sm p-2 bg-background/50 hover:bg-background/80 transition-all hover:shadow-sm active:scale-[0.98]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image 
                      src="/LOGO BOX.png" 
                      height={20} 
                      width={20} 
                      className="rounded-sm mr-2 flex-shrink-0" 
                      style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
                      alt="Site Box"
                    />
                    <span className="text-xs font-medium">Site Box</span>
                  </Link>
                  <Link 
                    href={'https://cristallux.com.br'} 
                    className="flex items-center rounded-sm p-2 bg-background/50 hover:bg-background/80 transition-all hover:shadow-sm active:scale-[0.98]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image 
                      src="/icon_cristal.svg" 
                      height={20} 
                      width={20} 
                      className="rounded-sm mr-2 flex-shrink-0 size-5" 
                      alt="Cristallux"
                    />
                    <span className="text-xs font-medium">Cristallux</span>
                  </Link>
                  <Link 
                    href={'https://centraldofuncionario.com.br/60939'} 
                    className="flex items-center rounded-sm p-2 bg-background/50 hover:bg-background/80 transition-all hover:shadow-sm active:scale-[0.98]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image 
                      src="/central-funcionario.ico" 
                      height={20} 
                      width={20} 
                      className="rounded-sm mr-2 flex-shrink-0" 
                      style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
                      alt="Central do Colaborador"
                    />
                    <span className="text-xs font-medium">Central do Colaborador</span>
                  </Link>
                </div>
              </div>

              {/* Divisor */}
              <Separator />

              {/* Treinamento */}
              <div>
                <h4 className="text-xs font-medium mb-2 text-muted-foreground">Treinamento</h4>
                <div className="space-y-1.5">
                  <Link 
                    href={'https://painel.umentor.com.br/cadastro_treinamento/?con_cod=ges449602&pla=5'} 
                    className="flex items-center rounded-sm p-2 bg-background/50 hover:bg-background/80 transition-all hover:shadow-sm active:scale-[0.98]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image 
                      src="/umentor.jpg" 
                      height={20} 
                      width={20} 
                      className="rounded-sm mr-2 flex-shrink-0" 
                      style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
                      alt="Umentor"
                    />
                    <span className="text-xs font-medium">Umentor</span>
                  </Link>
                  <Link 
                    href={'https://cristaluni.com.br'} 
                    className="flex items-center rounded-sm p-2 bg-background/50 hover:bg-background/80 transition-all hover:shadow-sm active:scale-[0.98]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LucideGraduationCap className="mr-2 flex-shrink-0 text-primary" style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}/>
                    <span className="text-xs font-medium">CristalUni</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Desktop: Sites e Treinamento lado a lado */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-4">
              {/* Sites */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Sites</h4>
                <div className="space-y-2">
                  <Link 
                    href={'https://boxdistribuidor.com.br'} 
                    className="flex items-center rounded-sm p-2.5 bg-background/50 hover:bg-background/80 transition-all hover:shadow-sm active:scale-[0.98]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image 
                      src="/LOGO BOX.png" 
                      height={24} 
                      width={24} 
                      className="rounded-sm mr-3 flex-shrink-0" 
                      style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }}
                      alt="Site Box"
                    />
                    <span className="text-sm font-medium">Site Box</span>
                  </Link>
                  <Link 
                    href={'https://cristallux.com.br'} 
                    className="flex items-center rounded-sm p-2.5 bg-background/50 hover:bg-background/80 transition-all hover:shadow-sm active:scale-[0.98]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image 
                      src="/icon_cristal.svg" 
                      height={24} 
                      width={24} 
                      className="rounded-sm mr-3 flex-shrink-0" 
                      style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }}
                      alt="Cristallux"
                    />
                    <span className="text-sm font-medium">Cristallux</span>
                  </Link>
                  <Link 
                    href={'https://centraldofuncionario.com.br/60939'} 
                    className="flex items-center rounded-sm p-2.5 bg-background/50 hover:bg-background/80 transition-all hover:shadow-sm active:scale-[0.98]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image 
                      src="/central-funcionario.ico" 
                      height={24} 
                      width={24} 
                      className="rounded-sm mr-3 flex-shrink-0" 
                      style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }}
                      alt="Central do Colaborador"
                    />
                    <span className="text-sm font-medium">Central do Colaborador</span>
                  </Link>
                </div>
              </div>

              {/* Treinamento */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Treinamento</h4>
                <div className="space-y-2">
                  <Link 
                    href={'https://painel.umentor.com.br/cadastro_treinamento/?con_cod=ges449602&pla=5'} 
                    className="flex items-center rounded-sm p-2.5 bg-background/50 hover:bg-background/80 transition-all hover:shadow-sm active:scale-[0.98]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image 
                      src="/umentor.jpg" 
                      height={24} 
                      width={24} 
                      className="rounded-sm mr-3 flex-shrink-0" 
                      style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }}
                      alt="Umentor"
                    />
                    <span className="text-sm font-medium">Umentor</span>
                  </Link>
                  <Link 
                    href={'https://cristaluni.com.br'} 
                    className="flex items-center rounded-sm p-2.5 bg-background/50 hover:bg-background/80 transition-all hover:shadow-sm active:scale-[0.98]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LucideGraduationCap className="mr-3 flex-shrink-0 text-primary" style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }}/>
                    <span className="text-sm font-medium">CristalUni</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Ideias - Não exibir para usuários Totem */}
          {!isTotem && (
            <div className="bg-muted rounded-lg p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold mb-3 flex items-center gap-2">
                <span>Ideias</span>
              </h3>
              <SuggestionsWrapper />
            </div>
          )}
        </div>
      </div>
      <div className="w-full px-4 md:px-4 lg:px-8 space-y-4 md:space-y-6">
        {/* Seção de Conteúdo - Video e Clima */}
        {
          videos.length > 0 && (
            <VideosCarousel className="w-full" itens={videos} enterprise={userEnterprise} />
          )
        }
      </div>
   
    <div> 
    <DashboardShell className="p-0">
      <NewsDisplay className="w-full"/>
    </DashboardShell>
    </div>
      {/* Footer com Redes Sociais */}
      <div className="mt-8 lg:mt-12 bg-muted/50 border-t">
        <div className="max-w-6xl mx-auto px-4 md:px-2 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Redes Sociais */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Redes Sociais
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-x-3">
                  <FaInstagram className="text-pink-500 flex-shrink-0"/>
                  <div className="flex flex-wrap gap-x-2 text-sm">
                    <Link href={'https://instagram.com/box.distribuidor'} className="text-primary hover:underline">
                      @box.distribuidor
                    </Link>
                    <span className="text-muted-foreground">|</span>
                    <Link href={'https://instagram.com/cristalluxled'} className="text-primary hover:underline">
                      @cristalluxled
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-x-3">
                  <FaFacebook className="text-blue-600 flex-shrink-0"/>
                  <div className="flex flex-wrap gap-x-2 text-sm">
                    <Link href={'https://facebook.com/fiosecia.boxdistribuidor'} className="text-primary hover:underline">
                      @fiosecia.boxdistribuidor
                    </Link>
                    <span className="text-muted-foreground">|</span>
                    <Link href={'https://facebook.com/cristalluxled'} className="text-primary hover:underline">
                      @cristalluxled
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-x-3">
                  <FaYoutube className="text-red-500 flex-shrink-0"/>
                  <div className="flex flex-wrap gap-x-2 text-sm">
                    <Link href={'https://youtube.com/@boxdistribuidor'} className="text-primary hover:underline">
                      @boxdistribuidor
                    </Link>
                    <span className="text-muted-foreground">|</span>
                    <Link href={'https://youtube.com/@cristallux'} className="text-primary hover:underline">
                      @cristalluxled
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Créditos */}
            <div className="flex items-end justify-center md:justify-end">
              <div className="text-center md:text-right">
                <div className="text-sm text-muted-foreground mb-2">
                  Elo &copy; 2025
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2 text-sm">
                  <span>Built with ❤️ by</span>
                  <Link
                    href={'https://allpines.com.br'}
                    className="flex items-center gap-1 font-bold text-primary hover:underline"
                  >
                    <Image src="/logoAllpines.webp" height={16} width={16} alt="Allpines" className="rounded"/>
                    Allpines
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para completar perfil */}
      <CompleteProfileModal
        isOpen={showProfileModal}
        user={user?.id ? {
          id: user.id,
          enterprise: user.enterprise ?? null,
          setor: user.setor ?? null
        } : null}
        onSuccess={() => {
          void refetchUser()
        }}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  )
}