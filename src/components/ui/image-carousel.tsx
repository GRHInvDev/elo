"use client"

import { useState, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Auto play functionality
  useEffect(() => {
    if (!autoPlay || images.length <= 1 || isHovered) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, images.length, autoPlayInterval, isHovered])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  if (!images || images.length === 0) {
    return null
  }

  // Se há apenas uma imagem, não mostra o carrossel
  if (images.length === 1) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-lg border", className)}>
        <div className={cn(
          "relative w-full",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "auto" && "aspect-auto"
        )}>
          <Image
            src={images[0]!}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
      {/* Container das imagens */}
      <div className="relative">
        <div className={cn(
          "relative w-full",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "auto" && "aspect-auto"
        )}>
          {images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "absolute inset-0 transition-transform duration-300 ease-in-out",
                index === currentIndex ? "translate-x-0" : 
                index < currentIndex ? "-translate-x-full" : "translate-x-full"
              )}
            >
              <Image
                src={image}
                alt={`${alt} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index === currentIndex}
              />
            </div>
          ))}
        </div>

        {/* Setas de navegação - apenas em desktop */}
        {showArrows && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white hidden md:flex"
              onClick={goToPrevious}
              disabled={images.length <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white hidden md:flex"
              onClick={goToNext}
              disabled={images.length <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Indicadores de posição (bolinhas) */}
        {showDots && images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  index === currentIndex 
                    ? "bg-white scale-125" 
                    : "bg-white/50 hover:bg-white/75"
                )}
                onClick={() => goToSlide(index)}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Contador de imagens */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  )
}
