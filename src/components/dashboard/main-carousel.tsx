"use client"

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { OptimizedImage } from "@/components/ui/optimized-image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface MainCarouselProps {
  itens: {
    /** Imagem base/desktop (obrigatória). */
    imageRef: string
    /** Imagem para telas pequenas; ausente → usa `imageRef`. */
    imageRefMobile?: string | null
    /** Imagem para perfil Totem; ausente → usa `imageRef`. */
    imageRefTotem?: string | null
    title: string
    /** Quando presente, o banner vira clicável (links externos abrem em nova aba). */
    href?: string | null
  }[],
  /** Usuário de perfil Totem: usa a imagem de totem (com fallback para a base). */
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
            const base = item.imageRef || "/placeholder.svg"
            const image = (
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
                {isTotem ? (
                  // Perfil Totem: imagem própria do totem (fallback para a base).
                  <OptimizedImage
                    alt={item.title}
                    src={item.imageRefTotem ?? base}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <>
                    {/* Mobile: recorte próprio (fallback para a base) */}
                    <div className="absolute inset-0 md:hidden">
                      <OptimizedImage
                        alt={item.title}
                        src={item.imageRefMobile ?? base}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Desktop: imagem base inteira (sem corte); a largura do
                        banner varia conforme o card de aniversariantes, então
                        a arte é redimensionada para caber e fica centralizada. */}
                    <div className="absolute inset-0 hidden md:block">
                      <OptimizedImage
                        alt={item.title}
                        src={base}
                        fill
                        imageFit="contain"
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

