"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AnimationContextType {
  isAnimationEnabled: boolean
  toggleAnimation: () => void
  setAnimationEnabled: (enabled: boolean) => void
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

const ANIMATION_STORAGE_KEY = "elo-animation-enabled"

export function AnimationProvider({
  children,
  defaultEnabled = false,
}: { children: ReactNode; defaultEnabled?: boolean }) {
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(defaultEnabled)

  // Carregar estado do localStorage na inicialização
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(ANIMATION_STORAGE_KEY)
      if (savedState !== null) {
        const parsedState = JSON.parse(savedState) as boolean
        setIsAnimationEnabled(parsedState)
      }
    } catch (error) {
      console.warn("Erro ao carregar estado de animação do localStorage:", error)
    }
  }, [])

  // Salvar estado no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(ANIMATION_STORAGE_KEY, JSON.stringify(isAnimationEnabled))
    } catch (error) {
      console.warn("Erro ao salvar estado de animação no localStorage:", error)
    }
  }, [isAnimationEnabled])

  const toggleAnimation = () => {
    setIsAnimationEnabled((prev) => !prev)
  }

  const setAnimationEnabled = (enabled: boolean) => {
    setIsAnimationEnabled(enabled)
  }

  return (
    <AnimationContext.Provider value={{ isAnimationEnabled, toggleAnimation, setAnimationEnabled }}>
      {children}
    </AnimationContext.Provider>
  )
}

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (context === undefined) {
    throw new Error("useAnimation must be used within an AnimationProvider")
  }
  return context
}

