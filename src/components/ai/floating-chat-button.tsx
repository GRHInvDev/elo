"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import ChatInterface from "./chat-interface"

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 md:w-96 h-[500px] bg-muted rounded-lg shadow-lg overflow-hidden border flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Assistente RHenz</h3>
            <Button variant="ghost" size="icon" onClick={toggleChat} aria-label="Fechar chat">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </div>
      )}

      <Button
        onClick={toggleChat}
        className="h-14 w-14 rounded-full shadow-lg"
        aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
        aria-expanded={isOpen}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  )
}

