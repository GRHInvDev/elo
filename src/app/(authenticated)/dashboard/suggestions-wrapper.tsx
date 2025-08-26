"use client"

import { useState } from "react"
import { SuggestionsPreview, SuggestionsModal } from "@/components/admin/suggestion/suggestion-card"

export function SuggestionsWrapper() {
  const [suggestionsModalOpen, setSuggestionsModalOpen] = useState(false)

  return (
    <>
      <div className="w-full max-w-6xl place-self-center">
        <SuggestionsPreview onOpenModal={() => setSuggestionsModalOpen(true)} />
      </div>

      <SuggestionsModal
        isOpen={suggestionsModalOpen}
        onOpenChange={setSuggestionsModalOpen}
      />
    </>
  )
}
