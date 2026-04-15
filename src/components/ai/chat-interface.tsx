"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronDown,
  CogIcon,
  Loader2,
  MessageSquarePlus,
  Send,
  Square,
  StopCircle,
  Wrench,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import remarkGfm from "remark-gfm"
import ReactMarkdown from "react-markdown"
import type { Message, ToolInvocation } from "ai"
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import { ASSISTANT_CHAT_MARKDOWN_COMPONENTS } from "@/components/ai/assistant-chat-markdown"

const STORED_MESSAGE_CAP = 30

/** Atalhos enviados como mensagem do usuário para o assistente. */
const ASSISTANT_QUICK_PROMPTS: ReadonlyArray<{ label: string; prompt: string }> = [
  { label: "Salas agora", prompt: "Quais salas estão disponíveis para agora?" },
  { label: "Almoço hoje", prompt: "Eu já pedi o almoço?" },
  {
    label: "Carros livres",
    prompt: "Qual carro está a disposição para uso agora?",
  },
]

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  listCars: "Listar veículos da frota",
  listAvailableVehiclesNow: "Veículos disponíveis no período",
  getUserRentedVehicle: "Meu aluguel de veículo ativo",
  rentVehicle: "Registrar aluguel de veículo",
  listRooms: "Listar salas de reunião",
  listNowAvailableRooms: "Salas livres no horário",
  createBooking: "Criar reserva de sala",
  listUserBooking: "Minhas reservas de sala",
  deleteBooking: "Cancelar reserva de sala",
  listBookingByDate: "Reservas por período",
  getMySchedule: "Minha agenda do dia",
  searchColleague: "Buscar colaborador",
  listFormsForHelp: "Formulários disponíveis",
  registerSolicitation: "Registrar solicitação",
  createIdea: "Registrar ideia (caixa de ideias)",
  getMenuCafeteria: "Cardápio do refeitório",
  notifyColleague: "Notificar colega",
  listLunchRestaurants: "Restaurantes para pedido",
  listLunchMenuItems: "Cardápio do restaurante",
  getMyLunchOrderForDate: "Meu pedido de refeição",
  submitLunchOrder: "Enviar pedido de refeição",
}

function formatToolDisplayName(toolName: string): string {
  const mapped = TOOL_DISPLAY_NAMES[toolName]
  if (mapped) return mapped
  const spaced = toolName.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function getAssistantVisibleText(message: Message): string {
  if (message.role !== "assistant") return ""
  if (message.parts && message.parts.length > 0) {
    return message.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
  }
  return message.content ?? ""
}

function formatToolResultForDisplay(result: unknown): string {
  if (typeof result === "string") {
    const cleaned = result.replace(/\\r\\n/g, "\n")
    try {
      return JSON.stringify(JSON.parse(cleaned) as unknown, null, 2)
    } catch {
      return cleaned
    }
  }
  try {
    return JSON.stringify(result, null, 2)
  } catch {
    return String(result)
  }
}

function AssistantThinkingRow() {
  return (
    <div className="flex justify-start animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <div
        className="inline-flex items-center gap-3 rounded-2xl border border-border/35 bg-muted/25 px-4 py-3 shadow-sm"
        role="status"
        aria-label="Assistente está respondendo"
      >
        <span className="text-xs font-medium text-muted-foreground">Assistente</span>
        <span className="flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="chat-assistant-dot size-1.5 rounded-full bg-primary/75"
              style={{ animationDelay: `${i * 140}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

export default function ChatInterface() {
  const hydratedRef = useRef(false)
  const persistReadyRef = useRef(false)
  const lastSerializedRef = useRef<string | null>(null)

  const utils = api.useUtils()
  const { data: storedMessages, isSuccess } = api.aiAssistant.getSession.useQuery(undefined, {
    staleTime: 60_000,
  })
  const saveSession = api.aiAssistant.saveSession.useMutation()

  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    addToolResult,
    stop,
    handleSubmit,
    status,
    append,
  } = useChat({
    api: "/api/chat",
    maxSteps: 5,
    credentials: "include",
    initialMessages: [],
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!isSuccess || hydratedRef.current) {
      return
    }
    hydratedRef.current = true

    let initial = (storedMessages ?? []) as Message[]
    if (initial.length === 0 && typeof window !== "undefined") {
      const raw = localStorage.getItem("aiMessages")
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Message[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            initial = parsed
            localStorage.removeItem("aiMessages")
          }
        } catch {
          /* ignore */
        }
      }
    }

    const snapshot = initial.slice(-STORED_MESSAGE_CAP)
    lastSerializedRef.current = JSON.stringify(snapshot)
    if (snapshot.length > 0) {
      setMessages(snapshot)
    }
    persistReadyRef.current = true
  }, [isSuccess, storedMessages, setMessages])

  useEffect(() => {
    if (!persistReadyRef.current || !isSuccess) {
      return
    }
    const trimmed = messages.slice(-STORED_MESSAGE_CAP) as unknown[]
    const serialized = JSON.stringify(trimmed)
    if (serialized === lastSerializedRef.current) {
      return
    }
    const handle = window.setTimeout(() => {
      lastSerializedRef.current = serialized
      saveSession.mutate({ messages: trimmed })
    }, 900)
    return () => window.clearTimeout(handle)
  }, [messages, isSuccess, saveSession])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, status])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const startNewConversation = useCallback(() => {
    stop()
    setMessages([])
    setInput("")
    const empty: unknown[] = []
    lastSerializedRef.current = JSON.stringify(empty)
    saveSession.mutate(
      { messages: [] },
      {
        onSuccess: () => {
          void utils.aiAssistant.getSession.invalidate()
        },
      },
    )
  }, [stop, setMessages, setInput, saveSession, utils])

  if (!isMounted) {
    return null
  }

  if (!isSuccess) {
    return (
      <div className="flex flex-1 min-h-[200px] items-center justify-center p-6 text-muted-foreground text-sm">
        Carregando conversa…
      </div>
    )
  }

  const showQuickPrompts = messages.length === 0 && input.trim() === ""

  const lastMessage = messages[messages.length - 1]
  const showThinking =
    status === "streaming" && (lastMessage === undefined || lastMessage.role === "user")

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="shrink-0 border-b px-4 py-2.5">
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-9 w-full gap-2 text-xs font-medium"
          onClick={startNewConversation}
          disabled={status === "streaming"}
          aria-label="Nova conversa com o assistente"
        >
          <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" />
          Nova conversa
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">Olá! Como posso ajudar você hoje?</div>
        ) : (
          messages.map((message, messageIndex) => {
            const isLastAssistant = message.role === "assistant" && messageIndex === messages.length - 1
            const assistantStreaming = status === "streaming" && isLastAssistant
            const visibleAssistantText = getAssistantVisibleText(message)

            const assistantParts =
              message.role === "assistant"
                ? message.parts && message.parts.length > 0
                  ? message.parts
                  : message.content.trim().length > 0
                    ? [{ type: "text" as const, text: message.content }]
                    : []
                : null

            const lastAssistantTextPartIndex =
              assistantParts?.reduce((last, part, idx) => (part.type === "text" ? idx : last), -1) ?? -1

            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                  message.role === "assistant" &&
                    !(assistantStreaming && !visibleAssistantText) &&
                    "animate-in fade-in-0 slide-in-from-bottom-1 duration-300",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/40 bg-card/85 text-card-foreground backdrop-blur-sm",
                  )}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  ) : (
                    assistantParts?.map((p, i) => {
                      switch (p.type) {
                        case "reasoning":
                          return (
                            <Accordion type="single" collapsible key={i} className="mt-1 border-0">
                              <AccordionItem value="reasoning" className="border-0">
                                <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
                                  Raciocínio do modelo
                                </AccordionTrigger>
                                <AccordionContent className="rounded-lg bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                                  {p.reasoning}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )
                        case "text": {
                          const showCaret =
                            assistantStreaming &&
                            p.text.length > 0 &&
                            i === lastAssistantTextPartIndex
                          return (
                            <div key={i} className="relative min-w-0">
                              <div
                                className={cn(
                                  "assistant-chat-md",
                                  assistantStreaming && p.text.length > 0 && "motion-safe:transition-[opacity] motion-safe:duration-200",
                                )}
                              >
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={ASSISTANT_CHAT_MARKDOWN_COMPONENTS}
                                >
                                  {p.text}
                                </ReactMarkdown>
                              </div>
                              {showCaret ? (
                                <span
                                  className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-primary align-middle"
                                  aria-hidden
                                />
                              ) : null}
                            </div>
                          )
                        }
                        case "tool-invocation":
                          return (
                            <RenderToolInvocation
                              key={i}
                              toolInvocation={p.toolInvocation}
                              addResult={addToolResult}
                              stop={stop}
                            />
                          )
                        default:
                          return null
                      }
                    })
                  )}
                </div>
              </div>
            )
          })
        )}
        {showThinking ? <AssistantThinkingRow /> : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t bg-background/95 px-4 pt-3 pb-4 space-y-3">
        {showQuickPrompts ? (
          <div className="flex flex-col gap-2">
            {ASSISTANT_QUICK_PROMPTS.map(({ label, prompt }) => (
              <Button
                key={prompt}
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 w-full justify-center gap-1 px-3 text-xs font-normal"
                disabled={status === "streaming"}
                onClick={() => {
                  void append({ role: "user", content: prompt })
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className={showQuickPrompts ? "pt-1" : ""}>
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
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              className="size-10 shrink-0"
              size="icon"
              disabled={status === "streaming" || !input.trim()}
              aria-label="Enviar mensagem"
            >
              {status === "streaming" ? <CogIcon className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RenderToolInvocation({
  toolInvocation,
  addResult,
  stop,
}: {
  toolInvocation: ToolInvocation
  addResult: (result: { toolCallId: string; result: string }) => void
  stop?: () => void
}) {
  const toolCallId = toolInvocation.toolCallId
  const [loading, setLoading] = useState(true)
  const label = formatToolDisplayName(toolInvocation.toolName)

  if (toolInvocation.toolName === "askForConfirmation") {
    return (
      <div
        key={toolCallId}
        className="mt-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-3 text-sm leading-relaxed"
      >
        <p className="text-foreground/90">
          {typeof toolInvocation.args === "object" && toolInvocation.args !== null
            ? (toolInvocation.args as { message: string }).message
            : JSON.stringify(toolInvocation.args)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {"result" in toolInvocation ? (
            <span className="text-xs font-medium text-muted-foreground">Resposta: {String(toolInvocation.result)}</span>
          ) : (
            <>
              <Button size="sm" className="h-8" onClick={() => addResult({ toolCallId, result: "Sim" })}>
                Sim
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={() => addResult({ toolCallId, result: "Não" })}>
                Não
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  if ("result" in toolInvocation) {
    const body = formatToolResultForDisplay(toolInvocation.result)
    return (
      <Collapsible key={toolCallId} className="group mt-2 w-full max-w-xl">
        <CollapsibleTrigger className="flex w-full items-center gap-2.5 rounded-xl border border-border/45 bg-muted/25 px-3 py-2.5 text-left text-xs outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wrench className="size-3.5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-foreground">{label}</span>
            <span className="text-[10px] text-muted-foreground">Ferramenta · toque para ver detalhes</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <pre className="mt-1 max-h-44 overflow-auto rounded-lg border border-border/35 bg-background/80 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground shadow-inner">
            {body}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <div
      key={toolCallId}
      className="mt-2 flex flex-col gap-2 rounded-xl border border-dashed border-border/50 bg-muted/15 px-3 py-2.5"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {loading ? (
          <>
            <Loader2 className="size-3.5 shrink-0 animate-spin text-primary/80" aria-hidden />
            <span>
              Executando <span className="font-medium text-foreground/85">{label}</span>…
            </span>
          </>
        ) : (
          <>
            <StopCircle className="size-3.5 shrink-0 text-amber-600/90" aria-hidden />
            <span>
              Interrompido: <span className="font-medium text-foreground/85">{label}</span>
            </span>
          </>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-full text-xs"
        onClick={() => {
          stop?.()
          setLoading(false)
          addResult({ result: "stop", toolCallId: toolInvocation.toolCallId })
        }}
      >
        <Square className="mr-1.5 size-3" />
        Parar execução
      </Button>
    </div>
  )
}
