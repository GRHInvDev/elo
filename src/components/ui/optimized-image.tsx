"use client"

import Image, { type ImageProps } from "next/image"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  blurIntensity?: number
  onLoadingComplete?: ImageProps["onLoad"]
  imageFit?: "cover" | "contain"
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  blurIntensity = 8,
  onLoadingComplete,
  imageFit = "cover"
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  const handleLoadingComplete = useCallback<NonNullable<ImageProps["onLoad"]>>((img) => {
    setIsLoaded(true)
    onLoadingComplete?.(img)
  }, [onLoadingComplete])

  return (
    <div className="relative overflow-hidden w-full h-full">
      {/* Imagem de fundo borrada - sempre preenche todo o espaço */}
      <Image
        src={src}
        alt=""
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn(
          "absolute inset-0 scale-110",
          `blur-[${blurIntensity}px]`,
        "object-cover",
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {/* Imagem principal */}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn(
          "relative z-10",
          className,
          imageFit === "contain" ? "object-contain" : "object-cover",
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        priority={priority}
        onLoad={handleLoadingComplete}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )
}

