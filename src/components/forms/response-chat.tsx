"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Activity, Edit3, Info, Loader2, MessageSquare, Send, Tag, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface ResponseChatProps {
  responseId: string
  className?: string
}

function parseSystemEvent(text: string) {
  const match = /^\[(STATUS|ATENDIMENTO|TAG|EDICAO|SISTEMA)\]\s*([\s\S]*)$/.exec(text)
  if (!match) return null

  return {
    type: match[1] as "STATUS" | "ATENDIMENTO" | "TAG" | "EDICAO" | "SISTEMA",
    content: match[2]?.trim() ?? "",
  }
}

const SYSTEM_CONFIG = {
  STATUS: {
    label: "Status",
    icon: Activity,
    badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    bgClass: "bg-blue-500/[0.04] border-blue-500/15",
  },
  ATENDIMENTO: {
    label: "Atendimento",
    icon: UserCheck,
    badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    bgClass: "bg-emerald-500/[0.04] border-emerald-500/15",
  },
  TAG: {
    label: "Tag",
    icon: Tag,
    badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    bgClass: "bg-amber-500/[0.04] border-amber-500/15",
  },
  EDICAO: {
    label: "Edição",
    icon: Edit3,
    badgeClass: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    bgClass: "bg-cyan-500/[0.04] border-cyan-500/15",
  },
  SISTEMA: {
    label: "Sistema",
    icon: Info,
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    bgClass: "bg-primary/[0.04] border-primary/15",
  },
}

export function ResponseChat({ responseId, className }: ResponseChatProps) {
  const [message, setMessage] = useState("")
  const chatListContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevCountRef = useRef<number>(0)

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
    if (!chatListContainerRef.current) return
    const currentCount = chatMessages?.length ?? 0
    if (currentCount > 0 && currentCount !== prevCountRef.current) {
      prevCountRef.current = currentCount
      chatListContainerRef.current.scrollTop = chatListContainerRef.current.scrollHeight
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
      <div
        ref={chatListContainerRef}
        className="max-h-[340px] min-h-[140px] overflow-y-auto rounded-2xl border border-border/50 bg-background/50 p-3 sm:p-4"
      >
        {isLoadingChat ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : chatMessages && chatMessages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {chatMessages.map((msg) => {
              const systemEvent = parseSystemEvent(msg.message)

              if (systemEvent) {
                const config = SYSTEM_CONFIG[systemEvent.type] ?? SYSTEM_CONFIG.SISTEMA
                const IconComponent = config.icon

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl border p-2.5 text-xs text-foreground/90 transition-all",
                      config.bgClass,
                    )}
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-background/80 border border-border/40 shadow-2xs">
                      <IconComponent className="h-3 w-3 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
                            config.badgeClass,
                          )}
                        >
                          {config.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="prose prose-xs max-w-none text-foreground leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-0 whitespace-pre-wrap">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            blockquote: ({ children }) => (
                              <blockquote className="mt-1 border-l-2 border-primary/40 pl-2 text-muted-foreground italic">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {processMessageMarkdown(systemEvent.content)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
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
                          ? `${msg.user.firstName} ${msg.user.lastName ?? ""}`.trim()
                          : msg.user.email}
                      </p>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="mt-1 rounded-xl bg-card/90 border border-border/50 p-2.5 text-xs text-foreground break-words shadow-2xs">
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
              )
            })}
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

