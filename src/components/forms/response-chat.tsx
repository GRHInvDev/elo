"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, MessageSquare, Send } from "lucide-react"
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

  const processMessageMarkdown = (text: string): string => {
    let processed = text
    processed = processed.replace(/\*\*\s*\{\s*([^}]+?)\s*\}\s*\*\*/g, "**$1**")
    processed = processed.replace(/\\n/g, "\n")
    return processed
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="max-h-[300px] min-h-[120px] overflow-y-auto rounded-2xl border border-border/50 bg-background/50 p-3 sm:p-4">
        {isLoadingChat ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : chatMessages && chatMessages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex gap-2.5 sm:gap-3 items-start">
                <Avatar className="h-7 w-7 shrink-0 rounded-full border border-border/40 mt-0.5">
                  <AvatarImage src={msg.user.imageUrl ?? ""} />
                  <AvatarFallback className="text-[10px]">
                    {msg.user.firstName?.[0] ?? msg.user.email[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-xs text-foreground truncate">
                      {msg.user.firstName
                        ? `${msg.user.firstName} ${msg.user.lastName ?? ""}`
                        : msg.user.email}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="mt-1 rounded-xl bg-card/80 border border-border/40 p-2.5 text-xs sm:text-sm text-foreground break-words prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className="mb-0 whitespace-pre-wrap">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-foreground">{children}</strong>
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
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground gap-1.5">
            <MessageSquare className="h-5 w-5 opacity-40 text-primary" />
            <p className="text-xs">Nenhuma mensagem ainda.</p>
            <p className="text-[10px] opacity-70">Envie uma mensagem abaixo para tirar dúvidas ou passar informações.</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          className="flex-1 min-h-[56px] h-14 text-xs rounded-xl border-border/60 bg-background/50 focus:bg-background resize-none"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending}
          className="flex-shrink-0 rounded-xl px-3.5 shadow-sm"
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

