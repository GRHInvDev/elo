"use client"

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { OptimizedImage } from "@/components/ui/optimized-image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { WeatherWidget } from "@/components/dashboard/weather-widget"
import { type Enterprise } from "@prisma/client"

interface MainCarouselProps {
  itens: {
    imageRef: string
    title: string
  }[],
  className?: string
  enterprise?: Enterprise | null
}

export function VideosCarousel({ itens, className, enterprise }: MainCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    setCount(carouselApi.scrollSnapList().length)
    setCurrent(carouselApi.selectedScrollSnap())

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])

  return (
    <div className={cn("w-full", className)}>
      {/* Grid estático no desktop - 3 colunas */}
      <div className="hidden md:grid md:grid-cols-3 mt-8 gap-4 md:gap-6 w-full">
        {/* Primeira coluna - Vídeos */}
        {itens.map((item, index) => (
          <div key={index} className="w-full h-[400px]">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
              <iframe
                src={item.imageRef}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        ))}
        
        {/* Segunda coluna - Banner */}
        <div className="w-full h-[400px]">
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
            <Link className="relative size-full flex items-center bg-black" href="https://www.boxdistribuidor.com.br/sobre">
              <OptimizedImage className="object-cover" fill src="/banners/Banners-intranet-3.png" alt="box"/>
            </Link>
          </div>
        </div>

        {/* Terceira coluna - WeatherWidget */}
        <div className="w-full h-[400px]">
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
            <WeatherWidget className="h-full" enterprise={enterprise} />
          </div>
        </div>
      </div>

      {/* Carrossel no mobile */}
      <div className="md:hidden mt-4">
        <Carousel
          className="w-full"
          setApi={setCarouselApi}
          opts={{
            loop: true,
            align: "center",
            inViewThreshold: 1,
            dragFree: true
          }}
        >
          <CarouselContent className="-ml-2 md:-ml-4" style={{ touchAction: 'pan-x pan-y' }}>
            {itens.map((item, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 basis-full" style={{ touchAction: 'pan-x' }}>
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg" style={{ touchAction: 'pan-x' }}>
                  <iframe
                    src={item.imageRef}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    loading="lazy"
                    style={{ touchAction: 'pan-x pinch-zoom' }}
                  ></iframe>
                </div>
              </CarouselItem>
            ))}
            <CarouselItem className="pl-2 md:pl-4 basis-full">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
                <Link className="relative size-full flex items-center bg-black" href="https://www.boxdistribuidor.com.br/sobre">
                  <OptimizedImage className="object-cover" fill src="/banners/Banners-intranet-3.png" alt="box"/>
                </Link>
              </div>
            </CarouselItem>
            <CarouselItem className="pl-2 md:pl-4 basis-full">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
                <WeatherWidget className="h-full" enterprise={enterprise} />
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>

        {/* Indicators - Apenas no mobile */}
        {count > 0 && (
          <div className="flex justify-center gap-2 relative -translate-y-8 z-10">
            <div className="rounded-full bg-muted/50 backdrop-blur-sm flex items-center gap-2 p-1.5">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  className={`size-2 rounded-full transition-all duration-200 ${current === index ? "bg-foreground w-6" : "bg-muted-foreground/50"}`}
                  onClick={() => carouselApi?.scrollTo(index)}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

