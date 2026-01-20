"use client"

import { useEffect, useRef } from "react"
import { useAnimation } from "@/contexts/animation-context"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isAnimationEnabled } = useAnimation()
  const animationRef = useRef<number | null>(null)
  
  // Criar blobs apenas uma vez usando useMemo
  const createBlobs = (width: number, height: number) => Array.from({ length: 6 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 300 + 100,
    xSpeed: (Math.random() - 0.5) * 0.7,
    ySpeed: (Math.random() - 0.5) * 0.7,
    color: Math.random() > 0.5 ? "#14b8a6" : "#ef4444",
  }))
  
  const blobsRef = useRef<ReturnType<typeof createBlobs>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    // Configurar o canvas para ocupar toda a tela
    const resizeCanvas = () => {
      const { innerWidth, innerHeight } = window
      canvas.width = innerWidth
      canvas.height = innerHeight
      
      // Recriar blobs quando o canvas for redimensionado
      if (blobsRef.current.length === 0) {
        blobsRef.current = createBlobs(innerWidth, innerHeight)
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Função de animação otimizada
    const animate = () => {
      // Limpar apenas a área necessária, não todo o canvas a cada frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Desenhar cada forma com blur
      for (const blob of blobsRef.current) {
        // Atualizar posição
        blob.x += blob.xSpeed
        blob.y += blob.ySpeed

        // Verificar colisão com as bordas
        if (blob.x < -blob.radius || blob.x > canvas.width + blob.radius) {
          blob.xSpeed *= -1
        }
        if (blob.y < -blob.radius || blob.y > canvas.height + blob.radius) {
          blob.ySpeed *= -1
        }

        // Desenhar forma com blur
        ctx.save()
        ctx.filter = "blur(80px)"
        ctx.beginPath()
        ctx.fillStyle = blob.color
        ctx.globalAlpha = 0.4
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Usar a referência para animationFrame
      animationRef.current = requestAnimationFrame(animate)
    }

    // Cancelar qualquer animação anterior antes de iniciar uma nova
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    // Iniciar ou parar a animação com base no estado
    if (isAnimationEnabled) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      // Limpar o canvas quando a animação estiver desativada
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      // Cancelar a animação quando o componente for desmontado
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isAnimationEnabled])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 w-full h-full" aria-hidden="true" />
}