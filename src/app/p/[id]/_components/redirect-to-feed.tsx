"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function RedirectToFeed({ postId }: { postId: string }) {
  const router = useRouter()

  useEffect(() => {
    // Redireciona imediatamente para o post específico no feed
    const targetUrl = `/news#${postId}`
    router.replace(targetUrl)
  }, [postId, router])

  return null
}
