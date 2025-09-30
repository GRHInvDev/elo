"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageCarouselProps {
  images: string[]
  alt?: string
  className?: string
  aspectRatio?: "square" | "video" | "auto"
  showArrows?: boolean
  showDots?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function ImageCarousel({
  images,
  alt = "Imagem do post",
  className,
  aspectRatio = "video",
  showArrows = true,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000
}: ImageCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Validar URLs das imagens
  const validImages = images?.filter(img => {
    if (!img || typeof img !== 'string') {
      console.warn('ImageCarousel: Invalid image URL:', img)
      return false
    }
    return true
  }) ?? []

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    setCurrent(carouselApi.selectedScrollSnap())

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])

  // Auto play functionality
  useEffect(() => {
    if (!autoPlay || validImages.length <= 1 || isHovered) return

    const interval = setInterval(() => {
      carouselApi?.scrollNext()
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, validImages.length, autoPlayInterval, isHovered, carouselApi])

  if (!images || images.length === 0) {
    console.warn('ImageCarousel: No images provided')
    return null
  }

  if (validImages.length === 0) {
    console.warn('ImageCarousel: No valid images found')
    return null
  }

  // Se há apenas uma imagem, não mostra o carrossel
  if (validImages.length === 1) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-lg border", className)}>
        <div className={cn(
          "relative w-full",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "auto" && "aspect-auto"
        )}>
          <OptimizedImage
            src={validImages[0]!}
            alt={alt}
            fill
            className="object-cover"
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-lg border", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Carousel
        className="w-full"
        setApi={setCarouselApi}
        opts={{
          loop: true,
          align: "center",
        }}
      >
        <CarouselContent>
          {validImages.map((image, index) => (
            <CarouselItem key={index} className={cn(
              "w-full",
              aspectRatio === "square" && "h-96",
              aspectRatio === "video" && "h-56",
              aspectRatio === "auto" && "h-64"
            )}>
              <OptimizedImage
                src={image}
                alt={`${alt} ${index + 1}`}
                fill
                className="object-cover"
                priority={index === current}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Setas de navegação - apenas em desktop */}
      {showArrows && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white hidden md:flex"
            onClick={() => carouselApi?.scrollPrev()}
            disabled={validImages.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white hidden md:flex"
            onClick={() => carouselApi?.scrollNext()}
            disabled={validImages.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Indicadores de posição (bolinhas) */}
      {showDots && validImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
          {validImages.map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-200",
                index === current
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              )}
              onClick={() => carouselApi?.scrollTo(index)}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Contador de imagens */}
      {validImages.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {current + 1} / {validImages.length}
        </div>
      )}
    </div>
  )
}
