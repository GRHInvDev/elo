"use client"

import { useEffect, useState } from "react"
import { api } from "@/trpc/react"
import { EmotionRulerModal } from "./emotion-ruler-modal"

export function EmotionRulerWrapper() {
  const [shouldShow, setShouldShow] = useState(false)
  const [ruler, setRuler] = useState<{
    id: string
    question: string
    emotions: Array<{
      id: string
      value: number
      emoji: string | null
      color: string
      states: string[]
      order: number
    }>
    backgroundColor?: string | null
  } | null>(null)

  const { data: modalData, isLoading, error } = api.emotionRuler.shouldShowModal.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 1,
    }
  )

  useEffect(() => {
    if (modalData) {
      // Se deve mostrar e tem régua válida
      if (modalData.shouldShow && modalData.ruler) {
        const emotions = Array.isArray(modalData.ruler.emotions) 
          ? modalData.ruler.emotions 
          : []
        
        // Só mostrar se tiver emoções configuradas
        if (emotions.length > 0) {
          setRuler({
            id: modalData.ruler.id,
            question: modalData.ruler.question,
            emotions,
            backgroundColor: modalData.ruler.backgroundColor,
          })
          setShouldShow(true)
        } else {
          setShouldShow(false)
          setRuler(null)
        }
      } else {
        setShouldShow(false)
        // Manter ruler se existir, mas não mostrar
        if (!modalData.ruler) {
          setRuler(null)
        }
      }
    }
  }, [modalData])


  const handleClose = (open: boolean) => {
    if (!open) {
      setShouldShow(false)
    }
  }

  // Não renderizar se estiver carregando
  if (isLoading) {
    return null
  }

  // Não renderizar se houver erro
  if (error) {
    return null
  }

  // Não renderizar se não deve mostrar ou não tem régua válida
  if (!shouldShow || !ruler || !Array.isArray(ruler.emotions) || ruler.emotions.length === 0) {
    return null
  }

  return (
    <EmotionRulerModal
      rulerId={ruler.id}
      question={ruler.question}
      emotions={ruler.emotions}
      open={shouldShow}
      onOpenChange={handleClose}
    />
  )
}
