"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Expand } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageMessageProps {
  imageUrl: string
  alt?: string
  className?: string
  maxWidth?: number
  maxHeight?: number
}

export function ImageMessage({
  imageUrl,
  alt = "Imagem da mensagem",
  className,
  maxWidth = 200,
  maxHeight = 200
}: ImageMessageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `chat-image-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg border-2 border-dashed",
        className
      )} style={{ width: maxWidth, height: maxHeight }}>
        <div className="text-center text-muted-foreground">
          <div className="text-sm">Imagem não encontrada</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative group", className)}>
      {/* Imagem com loading */}
      <div className="relative">
        {isLoading && (
          <div
            className="absolute inset-0 bg-muted animate-pulse rounded-lg flex items-center justify-center"
            style={{ width: maxWidth, height: maxHeight }}
          >
            <div className="text-xs text-muted-foreground">Carregando...</div>
          </div>
        )}

        <img
          src={imageUrl}
          alt={alt}
          className={cn(
            "rounded-lg border cursor-pointer transition-all hover:opacity-90",
            isLoading && "opacity-0"
          )}
          style={{
            maxWidth: `${maxWidth}px`,
            maxHeight: `${maxHeight}px`,
            width: 'auto',
            height: 'auto'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Overlay com ações */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-2">
          {/* Botão de expandir */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
              >
                <Expand className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              <div className="relative flex items-center justify-center min-h-[200px]">
                <img
                  src={imageUrl}
                  alt={alt}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Botão de download */}
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
