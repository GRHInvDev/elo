import { MainCarousel } from "@/components/dashboard/main-carousel"
import { BirthdaysCarousel } from "@/components/dashboard/birthdays-carousel"
import { api } from "@/trpc/server"
import { cn } from "@/lib/utils"
import { LinkIcon, LucideGraduationCap, LucideNewspaper, LucidePlane, LucidePlay } from "lucide-react"
import { VideosCarousel } from "@/components/dashboard/videos-carousel"
import Link from "next/link"
import NewsDisplay from "@/components/dashboard/news-displ"
import { routeItems } from "@/const/routes"
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa6"
import Image from "next/image"
import { UserRole } from "@prisma/client"
import { SuggestionsWrapper } from "./suggestions-wrapper"

export default async function DashboardPage() {
  // Buscar dados usando server-side tRPC
  const birthdays = await api.birthday.listCurrentMonth()
  const user = await api.user.me() 

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
      <div className={cn("grid grid-cols-1 gap-4 md:gap-6", (birthdays?.length==0 || posts.length==0 ) && "md:grid-cols-1")}>
        {
          posts.length > 0 &&
          <MainCarousel className={cn("w-full", (birthdays?.length==0) && "md:col-span-1")} itens={posts}/>
        }
        {
          birthdays?.length> 0 &&
          <BirthdaysCarousel className="w-full" itens={birthdays?.map((b)=>({
            imageRef: b.imageUrl??"",
            title: b.name
          }))}/>
        }

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
                  routeItems(user?.role ?? UserRole.USER).map((m,i)=> m.title !== "Dashboard" && (
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
      {/* Seção de Notícias - Design Assertivo e Responsivo */}
      <div className="w-full max-w-7xl mx-auto mt-6 md:mt-12 px-4 sm:px-6 lg:px-8">
        {/* Header da Seção com Design Melhorado */}
        <div className="mb-8 md:mb-12 text-center lg:text-left">
          <div className="inline-flex items-center justify-center lg:justify-start gap-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <LucideNewspaper className="w-6 h-6 md:w-8 md:h-8 text-primary"/>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              News
            </h1>
          </div>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Fique por dentro das últimas novidades, atualizações e acontecimentos importantes
          </p>

          {/* Linha decorativa */}
          <div className="mt-6 flex justify-center lg:justify-start">
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
          </div>
        </div>

        {/* Container de Notícias com Design Aprimorado */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl md:rounded-2xl border border-border/50 shadow-lg md:shadow-xl overflow-hidden">
          {/* Padding interno responsivo */}
          <div className="p-4 sm:p-6 lg:p-8">
            <NewsDisplay/>
          </div>

          {/* Gradiente sutil na parte inferior */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
        </div>

        {/* Espaçamento adicional para mobile */}
        <div className="h-8 md:h-12"></div>
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
    </div>
  )
}