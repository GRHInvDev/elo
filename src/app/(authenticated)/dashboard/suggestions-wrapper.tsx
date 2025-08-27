"use client"

import { useState } from "react"
import { SuggestionsPreview, SuggestionsModal } from "@/components/admin/suggestion/suggestion-card"

export function SuggestionsWrapper() {
  const [suggestionsModalOpen, setSuggestionsModalOpen] = useState(false)

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
