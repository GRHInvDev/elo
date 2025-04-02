import type { Metadata } from "next"

import { MainCarousel } from "@/components/dashboard/main-carousel"
import { BirthdaysCarousel } from "@/components/dashboard/birthdays-carousel"
import { api } from "@/trpc/server"
import { cn } from "@/lib/utils"
import { LinkIcon, LucideArrowRight, LucidePlane, LucidePlay } from "lucide-react"
import { VideosCarousel } from "@/components/dashboard/videos-carousel"
import Link from "next/link"
import NewsDisplay from "@/components/dashboard/news-displ"
import { routeItems } from "@/const/routes"
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa6"

export const metadata: Metadata = {
  title: "Dashboard | elo",
  description: "Dashboard principal da elo",
}

export default async function DashboardPage() {
  const birthdays = await api.birthday.listCurrentMonth();

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
     imageRef: '/banners/Banners-intranet-3.png',
     title: 'Banners-intranet-3',
    },
    {
     imageRef: '/banners/Banners-intranet-4.png',
     title: 'Banners-intranet-4',
    },
    {
     imageRef: '/banners/Banners-intranet-5.jpg',
     title: 'Banners-intranet-5',
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
    <div>
      <div className={cn("grid grid-cols-1 md:grid-cols-3", (birthdays?.length==0 || posts.length==0 ) && "md:grid-cols-1")}>
        {
          posts.length > 0 &&
          <MainCarousel className={cn("col-span-1 md:col-span-2", (birthdays?.length==0) && "md:col-span-1")} itens={posts}/>
        }
        {
          birthdays?.length> 0 &&
          <BirthdaysCarousel className="col-span-1" itens={birthdays?.map((b)=>({
            imageRef: b.imageUrl??"",
            title: b.name
          }))}/>
        }
        <div className="grid grid-cols-1 md:grid-cols-3">
          {
            videos.length> 0 &&
            <VideosCarousel className="col-span-1 md:col-span-2" itens={videos}/>
          }
          <div className="p-4 md:p-8 col-span-1">
            <div className="md:hidden">
              <h1 className="text-4xl mb-6 font-semibold">
                Funcionalidades
              </h1>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {
                  routeItems.map((m,i)=> m.title !== "Dashboard" && (
                    <div key={i} className="col-span-1">
                      <Link href={m.href} className="justify-center flex items-center bg-muted p-2 rounded-lg gap-x-2">
                        <m.icon className="size-4"/>
                        {m.title}
                      </Link>
                    </div>
                  ))
                }
              </div>
            </div>
            <div className="bg-muted rounded-md p-4">
              <div className="flex gap-2 items-center text-lg font-semibold">
                <LinkIcon/>
                Links
              </div>
              <div className="flex flex-col gap-y-4 mt-4">
                <Link href={'https://umentor.com.br'}>
                  <LucideArrowRight className="mr-2 size-4 inline-block"/>
                  Umentor 
                </Link>
                <Link href={'https://udemy.com'}>
                  <LucideArrowRight className="mr-2 size-4 inline-block"/>
                  Udemy 
                </Link>
                <Link href={'https://cristaluni.com.br'}>
                  <LucideArrowRight className="mr-2 size-4 inline-block"/>
                  CristalUni 
                </Link>
                <Link href={'https://boxdistribuidor.com.br'}>
                  <LucideArrowRight className="mr-2 size-4 inline-block"/>
                  Site Box 
                </Link>
                <Link href={'https://cristallux.com.br'}>
                  <LucideArrowRight className="mr-2 size-4 inline-block"/>
                  Site Cristallux 
                </Link>
              </div>
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
            {/**
             * Substituir com imagem
             */}
            <div className="flex items-center justify-center h-36 md:h-44 relative translate-x-14 md:translate-x-0 bg-muted rounded-md aspect-video">
              <LucidePlay/>
            </div>
          </div>
        </div>
      </div>
      <div className="place-self-center w-full max-w-6xl mt-4 md:px-4">
        <h1 className="text-4xl mb-6 ml-6 font-semibold">
          News
        </h1>
        <NewsDisplay/>
      </div>
      <div className="flex p-1 flex-col mt-8 h-36 bg-muted">
        <div className="flex-1 flex justify-center md:justify-start">
          <div className="p-4 md:ml-8 space-y-2">
            <div className="flex items-center gap-x-2">
              <FaInstagram className="mr-2"/>
              <Link href={'https://instagram.com/box.distribuidor'}>@box.distribuidor</Link>
              {' | '}
              <Link href={'https://instagram.com/cristalluxled'}>@cristalluxled</Link>
            </div>
            <div className="flex items-center gap-x-2">
              <FaFacebook className="mr-2"/>
              <Link href={'https://facebook.com/fiosecia.boxdistribuidor'}>@fiosecia.boxdistribuidor</Link>
              {' | '}
              <Link href={'https://facebook.com/cristalluxled'}>@cristalluxled</Link>
            </div>
            <div className="flex items-center gap-x-2">
              <FaYoutube className="mr-2"/>
              <Link href={'https://youtube.com/@boxdistribuidor'}>@boxdistribuidor</Link>
              {' | '}
              <Link href={'https://youtube.com/@cristallux'}>@cristalluxled</Link>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-8">
              Allpines &copy; elo
        </div>
      </div>
    </div>
  )
}