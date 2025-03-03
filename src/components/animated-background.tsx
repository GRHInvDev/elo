"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar o canvas para ocupar toda a tela
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Criar formas animadas
    const blobs = Array.from({ length: 6 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 300 + 100,
      xSpeed: (Math.random() - 0.5) * 0.7,
      ySpeed: (Math.random() - 0.5) * 0.7,
      color: Math.random() > 0.5 ? "#14b8a6" : "#ef4444", // teal-500 e red-500
    }))

    // Função de animação
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Desenhar cada forma com blur
      blobs.forEach((blob) => {
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
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 w-full h-full" aria-hidden="true" />
}

