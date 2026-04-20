"use client"

import { useRef, useCallback, useEffect, useReducer } from "react"

const minZoom = 0.5
const maxZoom = 5

type Vec2 = { x: number; y: number }

type ZoomState = {
  zoom: number
  position: Vec2
  isDragging: boolean
  dragStart: Vec2
}

type ZoomAction =
  | { type: "ZOOM_IN" }
  | { type: "ZOOM_OUT" }
  | { type: "RESET" }
  | { type: "WHEEL"; deltaY: number }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_POSITION"; position: Vec2 }
  | { type: "DRAG_START"; clientX: number; clientY: number }
  | { type: "DRAG_MOVE"; clientX: number; clientY: number }
  | { type: "DRAG_END" }

function clampZoom(z: number): number {
  return Math.max(minZoom, Math.min(z, maxZoom))
}

function clearDragIfZoomedOut(state: ZoomState, zoom: number): ZoomState {
  if (zoom <= 1) {
    return { ...state, zoom, isDragging: false }
  }
  return { ...state, zoom }
}

function zoomReducer(state: ZoomState, action: ZoomAction): ZoomState {
  switch (action.type) {
    case "ZOOM_IN": {
      const zoom = clampZoom(state.zoom * 1.2)
      return clearDragIfZoomedOut(state, zoom)
    }
    case "ZOOM_OUT": {
      const zoom = clampZoom(state.zoom / 1.2)
      return clearDragIfZoomedOut(state, zoom)
    }
    case "RESET":
      return {
        zoom: 1,
        position: { x: 0, y: 0 },
        isDragging: false,
        dragStart: { x: 0, y: 0 }
      }
    case "WHEEL": {
      const factor = action.deltaY > 0 ? 0.9 : 1.1
      const zoom = clampZoom(state.zoom * factor)
      return clearDragIfZoomedOut(state, zoom)
    }
    case "SET_ZOOM": {
      const zoom = clampZoom(action.zoom)
      return clearDragIfZoomedOut(state, zoom)
    }
    case "SET_POSITION":
      return { ...state, position: action.position }
    case "DRAG_START":
      if (state.zoom <= 1) return state
      return {
        ...state,
        isDragging: true,
        dragStart: {
          x: action.clientX - state.position.x,
          y: action.clientY - state.position.y
        }
      }
    case "DRAG_MOVE":
      if (!state.isDragging || state.zoom <= 1) return state
      return {
        ...state,
        position: {
          x: action.clientX - state.dragStart.x,
          y: action.clientY - state.dragStart.y
        }
      }
    case "DRAG_END":
      return { ...state, isDragging: false }
    default:
      return state
  }
}

const initialZoomState: ZoomState = {
  zoom: 1,
  position: { x: 0, y: 0 },
  isDragging: false,
  dragStart: { x: 0, y: 0 }
}

interface UseImageZoomReturn {
  zoom: number
  position: Vec2
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
  handleTouchEnd: (e: React.TouchEvent) => void
  handleDoubleClick: () => void
}

function getTouchDistance(
  touches: { length: number; [key: number]: { clientX: number; clientY: number } | undefined }
): number {
  if (touches.length < 2) return 0
  const t1 = touches[0]
  const t2 = touches[1]
  if (!t1 || !t2) return 0
  return Math.sqrt(
    (t2.clientX - t1.clientX) ** 2 + (t2.clientY - t1.clientY) ** 2
  )
}

/** Baseline síncrono para pinch (touchmove nativo roda antes do commit do React). */
type PinchBaseline = { d0: number; z0: number }

export function useImageZoom(): UseImageZoomReturn {
  const [state, dispatch] = useReducer(zoomReducer, initialZoomState)
  const containerRef = useRef<HTMLDivElement>(null!)
  const imageRef = useRef<HTMLImageElement>(null!)
  const stateRef = useRef(state)
  stateRef.current = state

  const pinchRef = useRef<PinchBaseline | null>(null)

  const isZoomed = state.zoom > 1

  const handleZoomIn = useCallback(() => {
    dispatch({ type: "ZOOM_IN" })
  }, [])

  const handleZoomOut = useCallback(() => {
    dispatch({ type: "ZOOM_OUT" })
  }, [])

  const handleReset = useCallback(() => {
    pinchRef.current = null
    dispatch({ type: "RESET" })
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    dispatch({ type: "WHEEL", deltaY: e.deltaY })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dispatch({ type: "DRAG_START", clientX: e.clientX, clientY: e.clientY })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    dispatch({ type: "DRAG_MOVE", clientX: e.clientX, clientY: e.clientY })
  }, [])

  const handleMouseUp = useCallback(() => {
    dispatch({ type: "DRAG_END" })
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d0 = getTouchDistance(e.touches)
      if (d0 > 0) {
        pinchRef.current = { d0, z0: stateRef.current.zoom }
      }
      dispatch({ type: "DRAG_END" })
    } else if (e.touches.length === 1 && stateRef.current.zoom > 1 && e.touches[0]) {
      const t = e.touches[0]
      dispatch({ type: "DRAG_START", clientX: t.clientX, clientY: t.clientY })
    }
  }, [])

  const handleTouchMove = useCallback((_e: React.TouchEvent) => {
    /* Pinch/pan com preventDefault: listener nativo em containerRef */
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchRef.current = null
    }
    if (e.touches.length === 0) {
      dispatch({ type: "DRAG_END" })
    }
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const onTouchMove = (e: TouchEvent) => {
      const s = stateRef.current
      const pinch = pinchRef.current

      if (e.touches.length === 2 && pinch && pinch.d0 > 0) {
        e.preventDefault()
        const d = getTouchDistance(e.touches)
        const z = clampZoom(pinch.z0 * (d / pinch.d0))
        dispatch({ type: "SET_ZOOM", zoom: z })
      } else if (e.touches.length === 1 && s.isDragging && s.zoom > 1 && e.touches[0]) {
        e.preventDefault()
        const t = e.touches[0]
        dispatch({ type: "DRAG_MOVE", clientX: t.clientX, clientY: t.clientY })
      }
    }

    node.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => {
      node.removeEventListener("touchmove", onTouchMove)
    }
  }, [])

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault()
      }
    }

    document.addEventListener("contextmenu", handleContextMenu)
    return () => document.removeEventListener("contextmenu", handleContextMenu)
  }, [])

  const handleDoubleClick = useCallback(() => {
    pinchRef.current = null
    dispatch({ type: "RESET" })
  }, [])

  return {
    zoom: state.zoom,
    position: state.position,
    isZoomed,
    isDragging: state.isDragging,
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
