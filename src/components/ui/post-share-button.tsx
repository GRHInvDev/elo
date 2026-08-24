"use client"

import React, { useState } from "react"
import { LucideCheck, LucideShare2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { sharePost, type SharePostData } from "@/lib/share-post"
import { cn } from "@/lib/utils"

export interface PostShareButtonProps {
  post: SharePostData
  variant?: "ghost" | "outline" | "default" | "secondary" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showLabel?: boolean
  label?: string
  onShareSuccess?: (method: "native" | "clipboard") => void
}

/**
 * Botão componentizado para compartilhamento de publicações do feed.
 * Abre a gaveta nativa de compartilhamento no mobile (Android/iOS)
 * ou copia o link direto com feedback de toast no desktop.
 */
export function PostShareButton({
  post,
  variant = "ghost",
  size = "sm",
  className,
  showLabel = true,
  label = "Compartilhar",
  onShareSuccess,
}: PostShareButtonProps) {
  const { toast } = useToast()
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (isSharing) return

    setIsSharing(true)

    try {
      const result = await sharePost(post)

      if (result.success) {
        if (result.method === "clipboard") {
          setCopied(true)
          toast({
            title: "Link copiado!",
            description: result.message ?? "O link da publicação foi copiado para a área de transferência.",
          })
          setTimeout(() => setCopied(false), 2000)
        }

        onShareSuccess?.(result.method as "native" | "clipboard")
      } else if (result.method === "error") {
        toast({
          title: "Erro ao compartilhar",
          description: result.message ?? "Não foi possível compartilhar a publicação no momento.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Erro ao compartilhar",
        description: "Ocorreu um erro inesperado ao tentar compartilhar.",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={isSharing}
      className={cn("text-muted-foreground hover:text-foreground transition-colors", className)}
      onClick={handleShare}
      title={label}
      aria-label={label}
    >
      {isSharing ? (
        <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin mr-1.5" />
      ) : copied ? (
        <LucideCheck className="h-4 w-4 md:h-5 md:w-5 mr-1.5 text-green-500" />
      ) : (
        <LucideShare2 className="h-4 w-4 md:h-5 md:w-5 mr-1.5" />
      )}
      {showLabel && <span>{copied ? "Copiado!" : label}</span>}
    </Button>
  )
}
