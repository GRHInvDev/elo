"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Button } from "@/components/ui/button"
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Download,
  Loader2
} from "lucide-react"
import { useImageZoom } from "@/hooks/use-image-zoom"
import Image from "next/image"
import { cn } from "@/lib/utils"

const TAP_MAX_PX = 12
const TAP_MAX_MS = 550

function clampIndex(i: number, len: number): number {
  if (len <= 0) return 0
  return Math.max(0, Math.min(i, len - 1))
}

interface ImageViewerProps {
  images: string[]
  initialIndex?: number
  alt?: string
  children?: React.ReactNode
  className?: string
}

export function ImageViewer({
  images,
  initialIndex = 0,
  alt = "Imagem",
  children,
  className
}: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(() => clampIndex(initialIndex, images.length))
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const pointerStartRef = useRef<{ x: number; y: number; t: number } | null>(null)

  const {
    zoom,
    position,
    isZoomed,
    isDragging,
    containerRef,
    imageRef,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDoubleClick
  } = useImageZoom()

  const currentImage = images[currentIndex]
  const hasMultiple = images.length > 1

  useEffect(() => {
    setCurrentIndex((prev) => clampIndex(prev, images.length))
  }, [images.length])

  useEffect(() => {
    if (!currentImage) {
      setIsImageLoaded(false)
      return
    }
    setIsImageLoaded(false)
  }, [currentImage, currentIndex])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      if (!open) {
        handleReset()
        setIsImageLoaded(false)
        setCurrentIndex(clampIndex(initialIndex, images.length))
      }
    },
    [handleReset, initialIndex, images.length]
  )

  const handleTriggerPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    pointerStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }
  }, [])

  const handleTriggerPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = pointerStartRef.current
      pointerStartRef.current = null
      if (!start) return
      if (e.button !== 0) return
      const dt = Date.now() - start.t
      const dx = Math.abs(e.clientX - start.x)
      const dy = Math.abs(e.clientY - start.y)
      if (dx < TAP_MAX_PX && dy < TAP_MAX_PX && dt < TAP_MAX_MS) {
        setCurrentIndex(clampIndex(initialIndex, images.length))
        setIsImageLoaded(false)
        setIsOpen(true)
      }
    },
    [initialIndex, images.length]
  )

  const handleTriggerPointerCancel = useCallback(() => {
    pointerStartRef.current = null
  }, [])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    handleReset()
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    handleReset()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" && hasMultiple) handlePrevious()
    if (e.key === "ArrowRight" && hasMultiple) handleNext()
    if (e.key === "Escape") handleOpenChange(false)
    if (e.key === "+") handleZoomIn()
    if (e.key === "-") handleZoomOut()
    if (e.key === "0") handleReset()
  }

  const handleDownload = async () => {
    if (!currentImage) return

    try {
      const response = await fetch(currentImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `image-${currentIndex + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao baixar imagem:", error instanceof Error ? error.message : error)
    }
  }

  return (
    <>
      <div
        onPointerDown={handleTriggerPointerDown}
        onPointerUp={handleTriggerPointerUp}
        onPointerCancel={handleTriggerPointerCancel}
        className={className}
        style={{ cursor: "pointer", touchAction: "manipulation" }}
      >
        {children}
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          hideClose
          className="max-w-none w-screen h-screen max-h-[100dvh] p-0 bg-black/95 border-0 rounded-none"
          onKeyDown={handleKeyDown}
        >
          <VisuallyHidden>
            <DialogTitle>Visualizador de Imagem - {alt}</DialogTitle>
          </VisuallyHidden>
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
            onClick={() => handleOpenChange(false)}
            role="presentation"
          >
            <div
              className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center gap-2 pr-14 sm:pr-4"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 min-w-0">
                {hasMultiple && (
                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm shrink-0">
                    {currentIndex + 1} / {images.length}
                  </div>
                )}
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm shrink-0">
                  {Math.round(zoom * 100)}%
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenChange(false)
                }}
                className="text-white hover:bg-white/20 shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div
              className="absolute top-1/2 right-3 sm:right-4 z-20 flex flex-col gap-2 -translate-y-1/2 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  handleZoomIn()
                }}
                className="text-white hover:bg-white/20"
                disabled={zoom >= 5}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  handleZoomOut()
                }}
                className="text-white hover:bg-white/20"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  handleReset()
                }}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  void handleDownload()
                }}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>

            {hasMultiple && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevious()
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-11 w-11 sm:h-12 sm:w-12 z-40"
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    ‹
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                  className="absolute right-[3.25rem] sm:right-20 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-11 w-11 sm:h-12 sm:w-12 z-40"
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    ›
                  </span>
                </Button>
              </>
            )}

            <div
              ref={containerRef}
              className={cn(
                "relative w-full h-full overflow-hidden select-none touch-none",
                isZoomed ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
              )}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
              onClick={(e) => e.stopPropagation()}
            >
              {currentImage && (
                <>
                  <Image
                    ref={imageRef}
                    src={currentImage}
                    alt={alt}
                    fill
                    sizes="100vw"
                    className={cn(
                      "object-contain transition-transform duration-200 ease-out",
                      !isImageLoaded && "opacity-0"
                    )}
                    style={{
                      transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                      transformOrigin: "center center"
                    }}
                    draggable={false}
                    onLoad={() => setIsImageLoaded(true)}
                  />
                  {!isImageLoaded && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 pointer-events-none"
                      aria-hidden
                    >
                      <Loader2 className="h-8 w-8 animate-spin text-white/80" />
                      <span className="text-sm text-white/70">Carregando…</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-white/70 text-center px-3 max-w-[min(100%,28rem)] z-20"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs sm:text-sm leading-snug hidden sm:block">
                Roda do mouse ou pinça para zoom • Arraste para mover • Duplo clique para resetar • + - 0
                {hasMultiple && " • Setas para navegar"}
              </p>
              <p className="text-xs sm:hidden sr-only">
                Pinça ou botões para zoom. Duplo clique reseta.
                {hasMultiple ? " Setas ou botões laterais para trocar imagem." : ""}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
