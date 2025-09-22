"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { EditResponseModal } from "./edit-response-modal"

interface EditResponseButtonProps {
  responseId: string
  formId: string
  isOwner: boolean
  isAuthor: boolean
}

export function EditResponseButton({ responseId, formId, isOwner, isAuthor }: EditResponseButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Só mostrar o botão se o usuário for o dono do formulário ou o autor da resposta
  if (!isOwner && !isAuthor) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
      >
        <Edit className="h-4 w-4 mr-1" />
        Editar Resposta
      </Button>

      <EditResponseModal
        responseId={responseId}
        formId={formId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

