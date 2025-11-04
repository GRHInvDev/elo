"use client"

import { useState } from "react"
import { SuggestionsPreview, SuggestionsModal } from "@/components/admin/suggestion/suggestion-card"
import { api } from "@/trpc/react"
import { Card, CardContent } from "@/components/ui/card"

export function SuggestionsWrapper() {
  const [suggestionsModalOpen, setSuggestionsModalOpen] = useState(false)
  const { data: userData } = api.user.me.useQuery()
  const isTotem = userData?.role_config?.isTotem === true

  return (
    <>
      {isTotem ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Usuários Totem não podem submeter ideias.
            </p>
          </CardContent>
        </Card>
      ) : (
        <SuggestionsPreview onOpenModal={() => setSuggestionsModalOpen(true)} />
      )}

      <SuggestionsModal
        isOpen={suggestionsModalOpen}
        onOpenChange={setSuggestionsModalOpen}
      />
    </>
  )
}
