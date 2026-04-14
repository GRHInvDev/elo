"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Maximize2, MessageCircle, Minimize2, X } from "lucide-react"
import ChatInterface from "./chat-interface"

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleChat = (): void => {
    if (!isOpen) {
      setIsOpen(true)
      return
    }
    setIsOpen(false)
    setIsExpanded(false)
  }

  const openExpanded = (): void => {
    setIsOpen(true)
    setIsExpanded(true)
  }

  const collapseExpanded = (): void => {
    setIsExpanded(false)
  }

  const closeAssistant = (): void => {
    setIsOpen(false)
    setIsExpanded(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      <Dialog
        open={isOpen && isExpanded}
        onOpenChange={(open) => {
          if (!open) {
            setIsExpanded(false)
          }
        }}
      >
        <DialogContent
          hideClose
          className="flex h-[min(calc(100vh-1.5rem),56rem)] w-[calc(100vw-1.5rem)] max-w-[min(100vw-1.5rem,56rem)] translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden p-0 sm:rounded-lg z-[100]"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b bg-background px-4 py-3 text-left">
            <DialogTitle className="truncate pr-2 text-left text-base font-medium">
              Assistente RHenz
            </DialogTitle>
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={collapseExpanded}
                aria-label="Recolher para o painel flutuante"
              >
                <Minimize2 className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={closeAssistant}
                aria-label="Fechar assistente"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Conversa em tela ampla com o assistente virtual da intranet
          </DialogDescription>
          <div className="min-h-0 flex-1 overflow-hidden bg-muted">
            <ChatInterface />
          </div>
        </DialogContent>
      </Dialog>

      {isOpen && !isExpanded ? (
        <div className="absolute bottom-16 right-0 flex h-[500px] w-80 flex-col overflow-hidden rounded-lg border bg-muted shadow-lg md:w-96">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-background px-3 py-3">
            <h3 className="truncate text-sm font-medium md:text-base">Assistente RHenz</h3>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={openExpanded}
                aria-label="Expandir conversa em tela ampla"
              >
                <Maximize2 className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={closeAssistant}
                aria-label="Fechar chat"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        onClick={toggleChat}
        className="h-14 w-14 rounded-full shadow-lg"
        aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
        aria-expanded={isOpen}
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </Button>
    </div>
  )
}
