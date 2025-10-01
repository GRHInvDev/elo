"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Download,
  Maximize2,
  Minimize2
} from "lucide-react"
import { useImageZoom } from "@/hooks/use-image-zoom"
import Image from "next/image"

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
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

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

  const handlePrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1)
    handleReset()
  }

  const handleNext = () => {
    setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0)
    handleReset()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasMultiple) handlePrevious()
    if (e.key === 'ArrowRight' && hasMultiple) handleNext()
    if (e.key === 'Escape') setIsOpen(false)
    if (e.key === '+') handleZoomIn()
    if (e.key === '-') handleZoomOut()
    if (e.key === '0') handleReset()
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-${currentIndex + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar imagem:', error)
    }
  }

  return (
    <>
      {/* Trigger element */}
      <div
        onClick={() => setIsOpen(true)}
        className={className}
        style={{ cursor: 'pointer' }}
      >
        {children}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-none w-screen h-screen p-0 bg-black/95"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Controls overlay */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {/* Counter */}
                {hasMultiple && (
                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentIndex + 1} / {images.length}
                  </div>
                )}

                {/* Zoom info */}
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {Math.round(zoom * 100)}%
                </div>
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Zoom controls */}
            <div className="absolute top-1/2 right-4 z-20 flex flex-col gap-2 -translate-y-1/2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="text-white hover:bg-white/20"
                disabled={zoom >= 5}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="text-white hover:bg-white/20"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation arrows */}
            {hasMultiple && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                >
                  <div className="text-2xl">‹</div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-20 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                >
                  <div className="text-2xl">›</div>
                </Button>
              </>
            )}

            {/* Image container */}
            <div
              ref={containerRef}
              className="relative w-full h-full overflow-hidden cursor-move"
              style={{
                cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
            >
              <Image
                ref={imageRef}
                src={currentImage}
                alt={alt}
                fill
                className="object-contain transition-transform duration-200 ease-out select-none"
                style={{
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  transformOrigin: 'center center'
                }}
                draggable={false}
                priority
              />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm text-center">
              <p>
                Use a roda do mouse ou pinça para zoom • Clique e arraste para mover •
                Duplo clique para resetar • Teclas + - 0 para zoom
                {hasMultiple && ' • Setas para navegar'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
