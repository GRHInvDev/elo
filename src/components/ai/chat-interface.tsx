"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CogIcon, Send, Square, StopCircle } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import remarkGfm from "remark-gfm"
import ReactMarkdown from "react-markdown"
import type { UIMessage, Message, ToolInvocation } from "ai"

export default function ChatInterface() {
  const { messages, input, handleInputChange, addToolResult, stop, handleSubmit, status } =
    useChat({
      api: "/api/chat",
      maxSteps: 5,
      initialMessages:
        typeof window !== "undefined"
          ? (JSON.parse(localStorage.getItem("aiMessages") ?? "[]") as Message[]) || undefined
          : [],
      onFinish: (m) => {
        const newMessages = messages.concat([m as UIMessage])
        saveMessagesToStorage(newMessages)
      },
    })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Função utilitária para limitar mensagens no localStorage a 30
  const saveMessagesToStorage = (messages: UIMessage[]) => {
    if (typeof window !== "undefined") {
      const limitedMessages = messages.slice(-30)
      localStorage.setItem("aiMessages", JSON.stringify(limitedMessages))
    }
  }  
  
  const onSubmit = (e: UIMessage) => {
    const newMessages = messages.concat([e])
    saveMessagesToStorage(newMessages)
  }
  
  // Scroll to the end of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Avoid hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-foreground py-8">Olá! Como posso ajudar você hoje?</div>
        ) : (
          messages?.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {message.role === "user"
                  ? message.content
                  : message.parts?.map((p, i) => {
                      switch (p.type) {
                        case "reasoning":
                          return (
                            <Accordion type="single" collapsible key={i}>
                              <AccordionItem value="reasoning">
                                <AccordionTrigger className="text-muted-foreground">Pensamento</AccordionTrigger>
                                <AccordionContent>{p.reasoning}</AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )
                        case "text":
                          return (
                            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                              {p.text}
                            </ReactMarkdown>
                          )
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
                    })}
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
                handleSubmit(e)
              }
            }}
          />
          <Button
            type="submit"
            className="size-10"
            size="icon"
            disabled={status==="streaming" || !input.trim()}
            aria-label="Enviar mensagem"
          >
            {status==="streaming" ? <CogIcon className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
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

  if (toolInvocation.toolName === "askForConfirmation") {
    return (
      <div key={toolCallId} className="mt-2 p-2 bg-secondary rounded-md text-sm sm:text-base">
        <p>
          {typeof toolInvocation.args === "object" && toolInvocation.args !== null
            ? (toolInvocation.args as {message: string}).message
            : JSON.stringify(toolInvocation.args)}
        </p>
        <div className="mt-2">
          {"result" in toolInvocation ? (
            <strong>{toolInvocation.result}</strong>
          ) : (
            <div className="space-x-2">
              <Button size="sm" onClick={() => addResult({ toolCallId, result: "Sim" })}>
                Sim
              </Button>
              <Button size="sm" variant="outline" onClick={() => addResult({ toolCallId, result: "Não" })}>
                Não
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return "result" in toolInvocation ? (
    <div key={toolCallId} className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
      <Accordion type="single" collapsible>
        <AccordionItem value={`Tool call ${toolInvocation.toolName}`}>
          <AccordionTrigger className="gap-2 text-xs sm:text-sm py-1">
            <CogIcon className="accordion-icon h-3 w-3 sm:h-4 sm:w-4 transition-all" />
            Used tool: {`${toolInvocation.toolName}`}
          </AccordionTrigger>
          <AccordionContent className="text-xs sm:text-sm break-words p-2 rounded-sm border-s border-muted-foreground">
            {typeof toolInvocation.result === "string"
              ? toolInvocation.result.replace(/"/g, "").replace(/\\r\\n/g, "\n\n")
              : JSON.stringify(toolInvocation.result)}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ) : (
    <div key={toolCallId} className="text-xs sm:text-sm text-muted-foreground flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        {loading ? (
          <>
            <CogIcon className="animate-spin" />
            Calling {toolInvocation.toolName}...
          </>
        ) : (
          <>
            <StopCircle />
            Stopped {toolInvocation.toolName}.
          </>
        )}
      </div>
      <Button
        variant={"outline"}
        onClick={() => {
          if (stop) {
            stop()
          }
          setLoading(false)
          addResult({ result: "stop", toolCallId: toolInvocation.toolCallId })
        }}
        className="w-full"
      >
        <Square /> Parar
      </Button>
    </div>
  )
}

