"use client"

import { emojiToId } from "@/lib/emoji-utils"
import { getEmojiImageUrl } from "@/lib/emoji-image-map"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface AnimatedEmojiProps {
  emoji: string | null | undefined
  size?: number
  className?: string
  playOnHover?: boolean
  animationIterations?: number
}

/**
 * Componente que renderiza emojis animados usando animated-fluent-emojis
 * Faz fallback para emoji estático se não houver suporte na biblioteca
 */
export function AnimatedEmoji({
  emoji,
  size = 24,
  className,
  playOnHover: _playOnHover = true,
  animationIterations: _animationIterations,
}: AnimatedEmojiProps) {
  // Se não há emoji, mostra placeholder
  if (!emoji || (typeof emoji === 'string' && emoji.trim() === "")) {
    return <span className={cn("text-muted-foreground", className)}>•</span>
  }

  // Remove espaços e normaliza
  const normalizedEmoji = typeof emoji === 'string' ? emoji.trim() : String(emoji).trim()
  const emojiId = emojiToId(normalizedEmoji)

  // Se o emoji tem suporte, tenta usar a imagem animada do GitHub
  if (emojiId) {
    const imageUrl = getEmojiImageUrl(emojiId)
    if (imageUrl) {
      return (
        <div className={cn("flex items-center justify-center", className)}>
          <Image
            src={imageUrl}
            alt={normalizedEmoji}
            width={size}
            height={size}
            className="object-contain"
            onError={(e) => {
              // Se a imagem falhar, mostra o emoji Unicode como fallback
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                const fallback = document.createElement('span')
                fallback.className = className ?? ''
                fallback.style.fontSize = `${size}px`
                fallback.textContent = normalizedEmoji
                parent.appendChild(fallback)
              }
            }}
          />
        </div>
      )
    }
  }

  // Fallback para emoji estático - sempre mostra o emoji original
  return (
    <span
      className={cn("inline-block leading-none select-none", className)}
      style={{ fontSize: `${size}px` }}
      role="img"
      aria-label="emoji"
    >
      {normalizedEmoji}
    </span>
  )
}
