"use client"

import { useState, useCallback } from "react"

export function useAnimationToggle(defaultEnabled = true) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled)

  const toggleAnimation = useCallback(() => {
    setIsEnabled((prev) => !prev)
  }, [])

  return {
    isEnabled,
    setIsEnabled,
    toggleAnimation,
  }
}

