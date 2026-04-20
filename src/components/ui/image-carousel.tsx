"use client"

import type { CSSProperties } from "react"
import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Teto de altura equivalente ao maior bucket antigo (aspect 3/4): height = width × (4/3). */
const AUTO_MAX_HEIGHT_CLASS =
  "max-h-[min(85dvh,calc(min(100vw,100%)*4/3))]"

interface ImageCarouselProps {
  images: string[]
  alt?: string
  className?: string
  aspectRatio?: "square" | "video" | "auto"
  showArrows?: boolean
  showDots?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  imageFit?: "cover" | "contain"
  /** Chamado quando o slide visível muda (Embla `select` / `reInit`). */
  onSlideIndexChange?: (index: number) => void
}

export function ImageCarousel({
  images,
  alt = "Imagem do post",
  className,
  aspectRatio = "video",
  showArrows = true,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  imageFit = "cover",
  onSlideIndexChange
}: ImageCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  /** Dimensões naturais por índice (modo auto, sem h-full no pai). */
  const [intrinsicByIndex, setIntrinsicByIndex] = useState<
    Record<number, { w: number; h: number } | null>
  >({})

  const validImages = images?.filter(img => {
    if (!img || typeof img !== 'string') {
      console.warn('ImageCarousel: Invalid image URL:', img)
      return false
    }
    return true
  }) ?? []

  const imageListKey = validImages.join("|")

  useEffect(() => {
    setIntrinsicByIndex({})
  }, [imageListKey])

  useEffect(() => {
    if (validImages.length === 1) {
      onSlideIndexChange?.(0)
    }
  }, [validImages.length, onSlideIndexChange])

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const emit = () => {
      const idx = carouselApi.selectedScrollSnap()
      setCurrent(idx)
      onSlideIndexChange?.(idx)
    }

    emit()

    carouselApi.on("select", emit)
    carouselApi.on("reInit", emit)

    return () => {
      carouselApi.off("select", emit)
      carouselApi.off("reInit", emit)
    }
  }, [carouselApi, onSlideIndexChange])

  useEffect(() => {
    if (carouselApi && validImages.length > 0) {
      carouselApi.reInit()
    }
  }, [carouselApi, validImages.length])

  useEffect(() => {
    if (!autoPlay || validImages.length <= 1 || isHovered) return

    const interval = setInterval(() => {
      carouselApi?.scrollNext()
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, validImages.length, autoPlayInterval, isHovered, carouselApi])

  const resolveAspectClass = (index: number): string => {
    if (aspectRatio === "square") {
      return "aspect-square"
    }

    if (aspectRatio === "video") {
      return "aspect-video"
    }

    if (aspectRatio === "auto") {
      return ""
    }

    return "aspect-auto"
  }

  const handleImageLoad = useCallback((index: number, img: HTMLImageElement) => {
    if (aspectRatio !== "auto") {
      return
    }

    const { naturalWidth, naturalHeight } = img
    if (!naturalWidth || !naturalHeight) {
      return
    }

    setIntrinsicByIndex((prev) => {
      const cur = prev[index]
      if (cur?.w === naturalWidth && cur?.h === naturalHeight) {
        return prev
      }
      return { ...prev, [index]: { w: naturalWidth, h: naturalHeight } }
    })
  }, [aspectRatio])

  const shouldUseFullHeight = className?.includes('h-full') ?? false
  const shouldUseFullWidth = className?.includes('w-full') ?? false

  const renderImage = (image: string, index: number) => {
    const hasExplicitAspect = aspectRatio === "square" || aspectRatio === "video"
    const dims = intrinsicByIndex[index]
    const useIntrinsicAuto =
      aspectRatio === "auto" && !shouldUseFullHeight

    const aspectClass = hasExplicitAspect
      ? resolveAspectClass(index)
      : shouldUseFullHeight
        ? ""
        : aspectRatio === "auto"
          ? ""
          : resolveAspectClass(index)

    const intrinsicStyle: CSSProperties | undefined =
      useIntrinsicAuto && dims
        ? { aspectRatio: `${dims.w} / ${dims.h}` }
        : undefined

    return (
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted",
          aspectClass,
          useIntrinsicAuto && AUTO_MAX_HEIGHT_CLASS,
          useIntrinsicAuto && !dims && "min-h-[200px]",
          !hasExplicitAspect && shouldUseFullHeight && "h-full"
        )}
        style={intrinsicStyle}
      >
        <OptimizedImage
          src={image}
          alt={`${alt} ${index + 1}`}
          fill
          className={cn(
            imageFit === "contain"
              ? "object-contain"
              : "object-cover"
          )}
          priority={index === 0}
          onLoadingComplete={(img) => handleImageLoad(index, img.target as HTMLImageElement)}
          imageFit={imageFit}
        />
      </div>
    )
  }

  if (!images || images.length === 0) {
    console.warn('ImageCarousel: No images provided')
    return null
  }

  if (validImages.length === 0) {
    console.warn('ImageCarousel: No valid images found')
    return null
  }

  if (validImages.length === 1) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg border max-w-[100vw] md:max-w-none",
          shouldUseFullHeight && "h-full",
          className
        )}
      >
        {renderImage(validImages[0]!, 0)}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border max-w-[100vw] md:max-w-none",
        shouldUseFullHeight && "h-full",
        shouldUseFullWidth && "w-full",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Carousel
        className={cn("w-full", shouldUseFullHeight && "h-full")}
        setApi={setCarouselApi}
        opts={{
          loop: true,
          align: "center",
          slidesToScroll: 1,
        }}
      >
        <CarouselContent
          className={cn(shouldUseFullHeight && "h-full", "-ml-0")}
          viewportClassName={shouldUseFullHeight ? "h-full" : undefined}
        >
          {validImages.map((image, index) => (
            <CarouselItem 
              key={`${image}-${index}`} 
              className={cn(
                "w-full pl-0 basis-full min-h-0",
                shouldUseFullHeight && "h-full",
                aspectRatio === "auto" && !shouldUseFullHeight && "flex flex-col justify-end"
              )}
            >
              {renderImage(image, index)}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {showArrows && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white hidden md:flex z-10"
            onClick={(e) => { e.stopPropagation(); carouselApi?.scrollPrev() }}
            disabled={validImages.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white hidden md:flex z-10"
            onClick={(e) => { e.stopPropagation(); carouselApi?.scrollNext() }}
            disabled={validImages.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {showDots && validImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
          {validImages.map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-200",
                index === current
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              )}
              onClick={(e) => { e.stopPropagation(); carouselApi?.scrollTo(index) }}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}

      {validImages.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
          {current + 1} / {validImages.length}
        </div>
      )}
    </div>
  )
}
