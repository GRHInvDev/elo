"use client"

import { MainCarousel } from "@/components/dashboard/main-carousel"
import { BirthdaysCarousel } from "@/components/dashboard/birthdays-carousel"
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import { LinkIcon, LucideGraduationCap, Coffee, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
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
import { EmotionRulerWrapper } from "@/components/emotion-ruler/emotion-ruler-wrapper"
import { useState, useEffect, useMemo } from "react"

// Variantes de animação para o footer
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const transitionDefault = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1] as const
}

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

    // Ajustar para usar o dia anterior (dia 09 ao invés do dia 10)
    const today = new Date()
    today.setDate(today.getDate() - 1) // SPE - FAMOSA GAMBIARRA
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
      {/* Modal da Régua de Emoções 
      <EmotionRulerWrapper />
      */}
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
                  routeItems(user?.role_config, false).map((m,i)=> m.title !== "Dashboard" && m.href && (
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
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

            {/* Copyright e desenvolvedor */}
            <div className="flex flex-col items-center md:items-end justify-end space-y-3">
              <motion.div
                variants={fadeInUp}
                transition={transitionDefault}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center md:items-end gap-2"
              >
                <p className="text-muted-foreground text-sm md:text-base text-center md:text-right">
                  ©️ {new Date().getFullYear()} Elo | Intranet
                </p>

                {/* Link criativo para a empresa desenvolvedora */}
                <motion.a
                  href="https://www.allpines.com.br"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 border border-primary/20 dark:border-primary/30 px-3 py-1.5 text-foreground text-xs transition-all hover:from-primary/20 hover:via-primary/10 hover:to-primary/20 dark:hover:from-primary/30 dark:hover:via-primary/20 dark:hover:to-primary/30 hover:shadow-md hover:border-primary/30 dark:hover:border-primary/40"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-muted-foreground text-xs">Feito com</span>
                  <motion.span
                    animate={{
                      rotate: [0, -5, 5, -5, 0],
                      y: [0, -2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: [0.4, 0, 0.6, 1] as const,
                    }}
                  >
                    <Coffee className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                  </motion.span>
                  <span className="text-muted-foreground text-xs">por</span>
                  <motion.span
                    className="font-semibold text-primary text-xs"
                    whileHover={{ x: 2 }}
                  >
                    Allpines
                  </motion.span>
                  <Sparkles className="h-3 w-3 text-primary/70 dark:text-primary/80 transition-transform group-hover:rotate-12" />
                </motion.a>
              </motion.div>
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