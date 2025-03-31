"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { Accordion, AccordionContent, AccordionTrigger } from "../ui/accordion"
import remarkGfm from "remark-gfm"
import ReactMarkdown from "react-markdown"

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Scroll para o final das mensagens quando novas mensagens são adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Evitar erros de hidratação
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-foreground  py-8">Olá! Como posso ajudar você hoje?</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {
                  message.role === "user" ? message.content:
                  message.parts.map((p, i)=>{
                    switch (p.type) {
                      case "reasoning":
                        return (
                        <Accordion type="single" key={i}>
                          <AccordionTrigger className="text-muted">
                            Pensamento
                          </AccordionTrigger>
                          <AccordionContent>
                            {p.reasoning}
                          </AccordionContent>
                        </Accordion>
                      );
                      case "text":
                        return (<ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{p.text}</ReactMarkdown>)
                      case "tool-invocation":
                        return (
                        <div key={i}>
                          <p className="text-muted-foreground animate-pulse">Utilizando &apos;{p.toolInvocation.toolName}&apos;</p>
                          <p>{p.toolInvocation.step}</p>
                        </div>
                        )
                      default:
                        return message.content;
                    }
                  })
                }{
                  message.content
                }{
                  JSON.stringify(message.parts)
                }
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Digite sua mensagem..."
            className="min-h-10 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as any)
              }
            }}
          />
          <Button type="submit" className="size-10" size="icon" disabled={isLoading || !input.trim()} aria-label="Enviar mensagem">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

