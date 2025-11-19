"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { Loader2, Send } from "lucide-react"

interface OrderChatProps {
  orderId: string
  className?: string
}

export function OrderChat({ orderId, className }: OrderChatProps) {
  const [message, setMessage] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { data: chatMessages, isLoading, refetch } = api.productOrder.getChat.useQuery(
    { orderId },
    { enabled: !!orderId }
  )

  const sendMessage = api.productOrder.sendChatMessage.useMutation({
    onSuccess: async () => {
      setMessage("")
      await refetch()
    },
  })
  const markChatRead = api.productOrder.markChatNotificationsAsRead.useMutation()

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  const handleSend = () => {
    const text = message.trim()
    if (!text || !orderId) return
    sendMessage.mutate({ orderId, message: text })
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => markChatRead.mutate({ orderId })}
          disabled={markChatRead.isPending}
        >
          {markChatRead.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Marcar como lido
        </Button>
      </div>
      <div className="border rounded-md p-3 h-64 overflow-y-auto bg-muted/30">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Carregando mensagens...
          </div>
        ) : (
          <div className="space-y-3">
            {(Array.isArray(chatMessages) ? chatMessages : []).map((m) => {
              const fullName = [m.user?.firstName, m.user?.lastName].filter(Boolean).join(" ")
              const name = fullName.length > 0 ? fullName : (m.user?.email ?? "Usuário")
              return (
                <div key={m.id} className="flex items-start gap-2">
                  <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                    {m.user?.imageUrl ? (
                      <Image src={m.user.imageUrl} alt={name} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{name}</div>
                    <div className="px-3 py-2 rounded-md bg-background border mt-1 whitespace-pre-wrap break-words">
                      {m.message}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Escreva sua mensagem..."
          className="min-h-[44px]"
          maxLength={2000}
          disabled={sendMessage.isPending}
        />
        <Button
          onClick={handleSend}
          disabled={sendMessage.isPending || !message.trim()}
          className="h-[44px] px-4"
        >
          {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}


