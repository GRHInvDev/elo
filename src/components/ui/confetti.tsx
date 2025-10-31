"use client"

import { useEffect, useState } from "react"

interface ConfettiParticle {
  id: number
  x: number
  y: number
  rotation: number
  speedY: number
  speedX: number
  size: number
  shape: string
}

export function Confetti() {
  const [particles, setParticles] = useState<ConfettiParticle[]>([])

  useEffect(() => {
    const shapes = ["🎉", "🎊", "✨", "⭐", "💫", "🌟", "🎈"]
    
    const newParticles: ConfettiParticle[] = []
    for (let i = 0; i < 60; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        speedY: 2 + Math.random() * 3,
        speedX: -2 + Math.random() * 4,
        size: 20 + Math.random() * 20,
        shape: shapes[Math.floor(Math.random() * shapes.length)] ?? "🎉",
      })
    }
    setParticles(newParticles)

    const interval = setInterval(() => {
      setParticles((prev) => {
        const updated = prev
          .map((p) => ({
            ...p,
            y: p.y + p.speedY,
            x: p.x + p.speedX,
            rotation: p.rotation + 5,
          }))
          .filter((p) => p.y < 120)

        if (updated.length === 0) {
          clearInterval(interval)
        }
        return updated
      })
    }, 50)

    return () => clearInterval(interval)
  }, [])

  if (particles.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: `rotate(${particle.rotation}deg)`,
            fontSize: `${particle.size}px`,
            transition: "opacity 0.3s ease-out",
          }}
        >
          {particle.shape}
        </div>
      ))}
    </div>
  )
}

