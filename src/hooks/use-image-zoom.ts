"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface UseImageZoomReturn {
  zoom: number
  position: { x: number; y: number }
  isZoomed: boolean
  isDragging: boolean
  containerRef: React.RefObject<HTMLDivElement>
  imageRef: React.RefObject<HTMLImageElement>
  handleZoomIn: () => void
  handleZoomOut: () => void
  handleReset: () => void
  handleWheel: (e: React.WheelEvent) => void
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUp: () => void
  handleTouchStart: (e: React.TouchEvent) => void
  handleTouchMove: (e: React.TouchEvent) => void
  handleTouchEnd: () => void
  handleDoubleClick: () => void
}

export function useImageZoom(): UseImageZoomReturn {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isZoomed, setIsZoomed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Touch state for pinch-to-zoom
  const [initialDistance, setInitialDistance] = useState<number | null>(null)
  const [initialZoom, setInitialZoom] = useState(1)

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const minZoom = 0.5
  const maxZoom = 5

  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.min(prev * 1.2, maxZoom)
      setIsZoomed(newZoom > 1)
      return newZoom
    })
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev / 1.2, minZoom)
      setIsZoomed(newZoom > 1)
      return newZoom
    })
  }, [])

  const handleReset = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setIsZoomed(false)
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => {
      const newZoom = Math.max(minZoom, Math.min(prev * delta, maxZoom))
      setIsZoomed(newZoom > 1)
      return newZoom
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [zoom, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, zoom, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2 || !touches[0] || !touches[1]) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const distance = getTouchDistance(e.touches)
      setInitialDistance(distance)
      setInitialZoom(zoom)
    } else if (e.touches.length === 1 && zoom > 1 && e.touches[0]) {
      // Single touch drag
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      })
    }
  }, [zoom, position, getTouchDistance])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 2 && initialDistance !== null) {
      // Pinch zoom
      const distance = getTouchDistance(e.touches)
      const scale = distance / initialDistance
      const newZoom = Math.max(minZoom, Math.min(initialZoom * scale, maxZoom))

      setZoom(newZoom)
      setIsZoomed(newZoom > 1)
    } else if (e.touches.length === 1 && isDragging && zoom > 1 && e.touches[0]) {
      // Single touch drag
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      })
    }
  }, [initialDistance, initialZoom, getTouchDistance, isDragging, zoom, dragStart])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setInitialDistance(null)
  }, [])

  // Prevent context menu on right click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  // Handle double click to reset
  const handleDoubleClick = useCallback(() => {
    handleReset()
  }, [handleReset])

  return {
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
  }
}
