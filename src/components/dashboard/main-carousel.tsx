"use client"

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { OptimizedImage } from "@/components/ui/optimized-image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface MainCarouselProps {
  itens: {
    /** Imagem padrão (desktop) e fallback para as demais variações. */
    imageRef: string
    /** Imagem para telas mobile (< 768px). Quando ausente, usa `imageRef`. */
    imageRefMobile?: string | null
    /** Imagem para usuários Totem. Quando ausente, usa `imageRef`. */
    imageRefTotem?: string | null
    title: string
    /** Quando presente, o banner vira clicável (links externos abrem em nova aba). */
    href?: string | null
  }[],
  /** Exibe a variação Totem das imagens quando o usuário é de um Totem. */
  isTotem?: boolean
  className?: string
}

export function MainCarousel({ itens, isTotem = false, className }: MainCarouselProps) {
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

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5500);

    return () => clearInterval(interval);
  }, [carouselApi]);


  return (
    <div className={cn(className)}>
      <Carousel
        className="w-full"
        setApi={setCarouselApi}
        opts={{
          loop: true,
          align: "center",
        }}
      >
        <CarouselContent>
          {itens.map((item, index) => {
            const isExternal = item.href?.startsWith("http") ?? false
            const desktopSrc = item.imageRef || "/placeholder.svg"
            const mobileSrc = item.imageRefMobile ?? desktopSrc
            const totemSrc = item.imageRefTotem ?? desktopSrc

            // Totem: variação própria (dispositivo fixo). Demais: alterna entre
            // mobile (< 768px) e desktop via breakpoint do Tailwind.
            const image = (
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
                {isTotem ? (
                  <OptimizedImage
                    alt={item.title}
                    src={totemSrc}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 md:hidden">
                      <OptimizedImage
                        alt={item.title}
                        src={mobileSrc}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 hidden md:block">
                      <OptimizedImage
                        alt={item.title}
                        src={desktopSrc}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </>
                )}
              </div>
            )

            return (
              <CarouselItem key={index} className="w-full h-96">
                {item.href ? (
                  <Link
                    href={item.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    aria-label={item.title}
                    className="block w-full h-full"
                  >
                    {image}
                  </Link>
                ) : (
                  image
                )}
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      {/* Indicators */}
      {count > 0 && (
        <div className="flex justify-center gap-2 relative -mb-4 -translate-y-8">
          <div className="rounded-full bg-muted/50 flex items-center gap-2 p-1">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                className={`size-2 md:size-3 rounded-full transition-colors ${current === index ? "bg-foreground" : "bg-muted-foreground"}`}
                onClick={() => carouselApi?.scrollTo(index)}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

