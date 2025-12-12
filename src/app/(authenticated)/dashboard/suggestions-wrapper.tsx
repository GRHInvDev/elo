"use client"

import { useState } from "react"
import { SuggestionsPreview, SuggestionsModal } from "@/components/admin/suggestion/suggestion-card"
import { api } from "@/trpc/react"

export function SuggestionsWrapper() {
  const [suggestionsModalOpen, setSuggestionsModalOpen] = useState(false)
  const { data: userData } = api.user.me.useQuery()
  const isTotem = userData?.role_config?.isTotem === true

  // Não exibir nada para usuários Totem
  if (isTotem) {
    return null
  }

  return (
    <>
      <SuggestionsPreview onOpenModal={() => setSuggestionsModalOpen(true)} />
      <SuggestionsModal
        isOpen={suggestionsModalOpen}
        onOpenChange={setSuggestionsModalOpen}
      />
    </>
  )
}
