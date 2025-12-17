"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  imageFit?: "cover" | "contain"
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
  imageFit = "cover"
}: ImageCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [computedAspectClasses, setComputedAspectClasses] = useState<Record<number, string>>({})

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

    const onSelect = () => {
      setCurrent(carouselApi.selectedScrollSnap())
    }

    carouselApi.on("select", onSelect)
    carouselApi.on("reInit", onSelect)

    return () => {
      carouselApi.off("select", onSelect)
      carouselApi.off("reInit", onSelect)
    }
  }, [carouselApi])

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

  const allowedAspects = useMemo(() => ([
    { value: 1, className: "aspect-square" },
    { value: 4 / 3, className: "aspect-[4/3]" },
    { value: 3 / 4, className: "aspect-[3/4]" },
    { value: 4 / 5, className: "aspect-[4/5]" },
  ] as const), [])

  const defaultAspectClass = "aspect-square"

  const resolveAspectClass = (index: number): string => {
    if (aspectRatio === "square") {
      return "aspect-square"
    }

    if (aspectRatio === "video") {
      return "aspect-video"
    }

    if (aspectRatio === "auto") {
      return computedAspectClasses[index] ?? defaultAspectClass
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

    const ratio = naturalWidth / naturalHeight
    let closest: typeof allowedAspects[number] = allowedAspects[0]
    let minDiff = Math.abs(ratio - closest.value)

    for (let i = 1; i < allowedAspects.length; i += 1) {
      const diff = Math.abs(ratio - allowedAspects[i]!.value)
      if (diff < minDiff) {
        closest = allowedAspects[i]!
        minDiff = diff
      }
    }

    setComputedAspectClasses(prev => {
      if (prev[index] === closest.className) {
        return prev
      }

      return {
        ...prev,
        [index]: closest.className,
      }
    })
  }, [allowedAspects, aspectRatio])

  // CORREÇÃO: Detectar se h-full ou w-full está no className
  const shouldUseFullHeight = className?.includes('h-full') ?? false
  const shouldUseFullWidth = className?.includes('w-full') ?? false

  const renderImage = (image: string, index: number) => {
    // CORREÇÃO: Se h-full está presente, NÃO usar aspect-ratio
    // Deixar o container pai controlar a altura
    const aspectClass = shouldUseFullHeight ? "" : resolveAspectClass(index)
    
    return (
      <div 
        className={cn(
          "relative w-full overflow-hidden bg-muted",
          // CORREÇÃO: Aplicar aspect-ratio APENAS se não for h-full
          aspectClass,
          // Se h-full, forçar altura 100%
          shouldUseFullHeight && "h-full"
        )}
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
        // CORREÇÃO: Remover h-full e w-full do className antes de aplicar
        // Eles serão aplicados internamente conforme necessário
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
        >
          {validImages.map((image, index) => (
            <CarouselItem 
              key={`${image}-${index}`} 
              className={cn(
                "w-full pl-0 basis-full",
                shouldUseFullHeight && "h-full"
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
            onClick={() => carouselApi?.scrollPrev()}
            disabled={validImages.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white hidden md:flex z-10"
            onClick={() => carouselApi?.scrollNext()}
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
              onClick={() => carouselApi?.scrollTo(index)}
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