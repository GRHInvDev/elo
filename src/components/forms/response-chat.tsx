"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface ResponseChatProps {
  responseId: string
  className?: string
}

export function ResponseChat({ responseId, className }: ResponseChatProps) {
  const [message, setMessage] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch chat messages
  const {
    data: chatMessages,
    isLoading: isLoadingChat,
    refetch: refetchChat,
  } = api.formResponse.getChat.useQuery({ responseId })

  // Send message mutation
  const sendMessageMutation = api.formResponse.sendChatMessage.useMutation({
    onSuccess: () => {
      setMessage("")
      void refetchChat()
    },
  })

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  const handleSendMessage = useCallback(() => {
    if (!message.trim() || sendMessageMutation.isPending) return

    sendMessageMutation.mutate({
      responseId,
      message: message.trim(),
    })
  }, [message, responseId, sendMessageMutation])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Process message markdown (similar to response-dialog)
  const processMessageMarkdown = (text: string): string => {
    let processed = text
    processed = processed.replace(/\*\*\s*\{\s*([^}]+?)\s*\}\s*\*\*/g, "**$1**")
    processed = processed.replace(/\\n/g, "\n")
    return processed
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium">Chat</h3>
      <div className="max-h-[300px] overflow-y-auto rounded-md border p-3 sm:p-4">
        {isLoadingChat ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : chatMessages && chatMessages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex gap-2 sm:gap-3">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                  <AvatarImage src={msg.user.imageUrl ?? ""} />
                  <AvatarFallback>
                    {msg.user.firstName?.[0] ?? msg.user.email[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <p className="font-medium text-xs sm:text-sm truncate">
                      {msg.user.firstName
                        ? `${msg.user.firstName} ${msg.user.lastName ?? ""}`
                        : msg.user.email}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="mt-1 text-sm sm:text-base break-words prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className="mb-0 whitespace-pre-wrap">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic">{children}</em>
                        ),
                        br: () => <br />,
                      }}
                    >
                      {processMessageMarkdown(msg.message)}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500">Nenhuma mensagem ainda.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="flex-1 min-h-[60px] text-sm"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending}
          className="flex-shrink-0 h-auto px-3 sm:px-4"
          size="default"
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
