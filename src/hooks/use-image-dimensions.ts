"use client"

import { useState, useCallback } from "react"

interface ImageDimensions {
  width: number
  height: number
}

interface UseImageDimensionsReturn {
  dimensions: ImageDimensions | null
  isLoading: boolean
  error: string | null
  checkDimensions: (imageUrl: string) => Promise<ImageDimensions | null>
  reset: () => void
}

export function useImageDimensions(): UseImageDimensionsReturn {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkDimensions = useCallback(async (imageUrl: string): Promise<ImageDimensions | null> => {
    if (!imageUrl) {
      setError("URL da imagem não fornecida")
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const img = new Image()

      return new Promise((resolve, reject) => {
        img.onload = () => {
          const dims = {
            width: img.naturalWidth,
            height: img.naturalHeight
          }
          setDimensions(dims)
          setIsLoading(false)
          resolve(dims)
        }

        img.onerror = () => {
          const errorMsg = "Erro ao carregar imagem"
          setError(errorMsg)
          setIsLoading(false)
          reject(new Error(errorMsg))
        }

        img.src = imageUrl
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMsg)
      setIsLoading(false)
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setDimensions(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    dimensions,
    isLoading,
    error,
    checkDimensions,
    reset
  }
}
