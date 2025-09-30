"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  blurIntensity?: number
  fill?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  blurIntensity = 10,
  fill = false
}: OptimizedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  // Extrair classes de object-fit do className
  const hasObjectCover = className?.includes('object-cover')
  const hasObjectContain = className?.includes('object-contain')
  const mainObjectFit = hasObjectCover ? 'object-cover' : hasObjectContain ? 'object-contain' : 'object-contain'

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Imagem de fundo borrada */}
      <Image
        src={src}
        alt=""
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn(
          "absolute inset-0 scale-110",
          `blur-[${blurIntensity}px]`,
          "object-cover", // Fundo sempre usa cover para garantir preenchimento
          imageLoaded && "opacity-0"
        )}
        priority={priority}
        onLoad={() => setImageLoaded(true)}
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
          mainObjectFit, // Usa o object-fit especificado
          "transition-opacity duration-300",
          !imageLoaded && "opacity-0"
        )}
        priority={priority}
        onLoad={() => setImageLoaded(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )
}

