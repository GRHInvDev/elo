"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface AnimationContextType {
  isAnimationEnabled: boolean
  toggleAnimation: () => void
  setAnimationEnabled: (enabled: boolean) => void
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

export function AnimationProvider({
  children,
  defaultEnabled = true,
}: { children: ReactNode; defaultEnabled?: boolean }) {
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(defaultEnabled)

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

