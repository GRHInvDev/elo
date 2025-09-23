"use client"

import { MainCarousel } from "@/components/dashboard/main-carousel"
import { BirthdaysCarousel } from "@/components/dashboard/birthdays-carousel"
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import { LinkIcon, LucideGraduationCap, LucideNewspaper, LucidePlane, LucidePlay } from "lucide-react"
import { VideosCarousel } from "@/components/dashboard/videos-carousel"
import Link from "next/link"
import NewsDisplay from "@/components/dashboard/news-displ"
import { routeItems } from "@/const/routes"
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa6"
import Image from "next/image"

import { SuggestionsWrapper } from "./suggestions-wrapper"
import { CompleteProfileModal } from "@/components/complete-profile-modal"
import { useState, useEffect } from "react"

export default function DashboardPage() {
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Buscar dados usando client-side tRPC
  const { data: birthdays } = api.birthday.listCurrentMonth.useQuery()
  const { data: user, refetch: refetchUser } = api.user.me.useQuery()

  // Tipagem para os dados do usuário
  // Removido: userRole não é mais necessário com novo sistema
  const userEnterprise = user?.enterprise ?? null
  const userSetor = user?.setor ?? null

  // Verificar se os campos obrigatórios estão preenchidos
  useEffect(() => {
    if (user && (!userEnterprise || !userSetor)) {
      setShowProfileModal(true)
    }
  }, [user, userEnterprise, userSetor])

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
    <div className="min-h-screen bg-background">
      {/* Seção Principal - Banners e Aniversários */}
      <div className={cn("grid grid-cols-1 md:grid-cols-3", (birthdays?.length==0 ) && "md:grid-cols-1")}>
        {
          posts.length > 0 &&
          <MainCarousel className={cn("w-full md:col-span-2", (birthdays?.length==0) && "md:col-span-1")} itens={posts}/>
        }
        {
          birthdays && birthdays.length > 0 &&
          <BirthdaysCarousel className="w-full md:col-span-1" itens={birthdays.map((b)=>({
            imageRef: b.imageUrl ?? "",
            title: b.name
          }))}/>
        }
    </div>
      <div className={cn("grid grid-cols-1 gap-4 md:gap-6", (birthdays?.length==0
       ) && "md:grid-cols-1")}>

        {/* Seção de Conteúdo - Vídeos, Links e ideias */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {
            videos.length> 0 && (
              <div className="lg:col-span-2">
                <VideosCarousel className="w-full" itens={videos}/>
              </div>
            )
          }
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            {/* Funcionalidades Mobile */}
            <div className="md:hidden">
              <h1 className="text-2xl md:text-4xl mb-4 md:mb-6 font-semibold">
                Funcionalidades
              </h1>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {
                  // routeItems(user?.role_config).map((m,i)=> m.title !== "Dashboard" && (
                  //   <div key={i} className="col-span-1">
                  //     <Link href={m.href} className="hover:bg-primary/30 transition-all justify-center flex items-center bg-muted p-3 rounded-lg gap-x-2 text-sm">
                  //       <m.icon className="size-4"/>
                  //       <span className="text-center leading-tight">{m.title}</span>
                  //     </Link>
                  //   </div>
                  // ))
                }
              </div>
            </div>

            {/* Links Úteis */}
            <div className="bg-muted rounded-md p-3 md:p-4">
              <div className="flex gap-2 items-center text-sm font-semibold mb-3">
                <LinkIcon className="size-4"/>
                Links Úteis
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href={'https://painel.umentor.com.br/cadastro_treinamento/?con_cod=ges449602&pla=5'} className="flex items-center rounded-md p-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <Image src="/umentor.jpg" height={20} width={20} className="rounded-md mr-2 flex-shrink-0" alt="umentor"/>
                  <span className="text-xs truncate">Umentor</span>
                </Link>
                <Link href={'https://cristaluni.com.br'} className="flex items-center rounded-md p-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <LucideGraduationCap className="size-4 mr-2 flex-shrink-0"/>
                  <span className="text-xs truncate">CristalUni</span>
                </Link>
                <Link href={'https://boxdistribuidor.com.br'} className="flex items-center rounded-md p-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <Image src="/LOGO BOX.png" height={20} width={20} className="rounded-md mr-2 flex-shrink-0" alt="Site Box"/>
                  <span className="text-xs truncate">Site Box</span>
                </Link>
                <Link href={'https://cristallux.com.br'} className="flex items-center rounded-md p-2 bg-background/50 hover:bg-background/80 transition-colors">
                  <Image src="/icon_cristal.svg" height={20} width={20} className="rounded-md mr-2 flex-shrink-0" alt="Cristaluni"/>
                  <span className="text-xs truncate">Cristallux</span>
                </Link>
              </div>
            </div>

            {/* Card de Ideias - Melhorado para mobile */}
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-3 md:mb-4">Ideias</h3>
              <SuggestionsWrapper />
            </div>
          </div>
        </div>
      </div>
      <div className="hidden w-full max-w-6xl place-self-center">
        <div className="ml-8 md:ml-16 mt-16 flex justify-between items-center overflow-hidden">
          <div className="flex items-center gap-8">
            <div className="p-2 bg-foreground size-14 md:size-28 flex items-center justify-center">
              <LucidePlane className="text-background size-8 md:size-20 rotate-45"/>
            </div>
            <h1 className="text-xl md:text-4xl font-semibold">
              OnBoarding
            </h1>
          </div>
          <div>
            <div className="flex items-center justify-center h-36 md:h-44 relative translate-x-14 md:translate-x-0 bg-muted rounded-md aspect-video">
              <LucidePlay/>
            </div>
          </div>
        </div>
      </div>
   
      {/* Footer com Redes Sociais */}
      <div className="mt-8 lg:mt-12 bg-muted/50 border-t">
        <div className="max-w-6xl mx-auto px-4 py-8">
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