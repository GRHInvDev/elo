"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { api } from "@/trpc/react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ResponseDetails } from "@/components/forms/response-details"
import { EditResponseButton } from "@/components/forms/edit-response-button"
import { type Field } from "@/lib/form-types"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface ResponseDialogProps {
    responseId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface CommandOption {
    key: string
    label: string
    value: string
    description?: string
}

export function ResponseDialog({ responseId, open, onOpenChange }: ResponseDialogProps) {
    const [message, setMessage] = useState("")
    const [showAutocomplete, setShowAutocomplete] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [slashPosition, setSlashPosition] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const chatEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const autocompleteRef = useRef<HTMLDivElement>(null)
    const trpcContext = api.useContext()

    // Fetch response details
    const { data: response, isLoading: isLoadingResponse } = api.formResponse.getById.useQuery(
        { responseId },
        { enabled: open },
    )

    // Fetch current user (quem está enviando a mensagem)
    const { data: currentUser } = api.user.me.useQuery()

    // Comandos disponíveis para autocomplete
    const getAvailableCommands = useCallback((): CommandOption[] => {
        if (!currentUser) return []
        
        return [
            {
                key: "email",
                label: "Email",
                value: currentUser.email ?? "",
                description: "Seu email",
            },
            {
                key: "nome",
                label: "Nome",
                value: currentUser.firstName
                    ? `${currentUser.firstName}${currentUser.lastName ? ` ${currentUser.lastName}` : ""}`.trim()
                    : (currentUser.email ?? ""),
                description: "Seu nome completo",
            },
        ]
    }, [currentUser])

    const availableCommands = getAvailableCommands()

    // Fetch chat messages
    const {
        data: chatMessages,
        isLoading: isLoadingChat,
        refetch: refetchChat,
    } = api.formResponse.getChat.useQuery({ responseId }, { enabled: open })

    // Send message mutation
    const sendMessageMutation = api.formResponse.sendChatMessage.useMutation({
        onSuccess: () => {
            setMessage("")
            void refetchChat()
      // Atualizar lista do Kanban para refletir possíveis mudanças
      void trpcContext.formResponse.listKanBan.invalidate()
        },
    })

  // Marcar visualização ao abrir o diálogo
  const markViewed = api.formResponse.markViewed.useMutation({
    onSuccess: () => {
      void trpcContext.formResponse.listKanBan.invalidate()
    }
  })

  useEffect(() => {
    if (open && responseId) {
      markViewed.mutate({ responseId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, responseId])

    // Scroll to bottom of chat when new messages arrive
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [chatMessages])

    // Resetar autocomplete quando o diálogo fechar
    useEffect(() => {
        if (!open) {
            setShowAutocomplete(false)
            setSlashPosition(null)
            setSearchQuery("")
            setSelectedIndex(0)
            setMessage("")
        }
    }, [open])

    // Fechar autocomplete ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showAutocomplete &&
                autocompleteRef.current &&
                !autocompleteRef.current.contains(event.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(event.target as Node)
            ) {
                setShowAutocomplete(false)
                setSlashPosition(null)
                setSearchQuery("")
            }
        }

        if (showAutocomplete) {
            document.addEventListener("mousedown", handleClickOutside)
            return () => {
                document.removeEventListener("mousedown", handleClickOutside)
            }
        }
    }, [showAutocomplete])

    // Filtrar comandos baseado na busca
    const filteredCommands = availableCommands.filter((cmd) =>
        cmd.key.toLowerCase().startsWith(searchQuery.toLowerCase())
    )

    const handleSendMessage = () => {
        if (message.trim() && responseId) {
            sendMessageMutation.mutate({
                responseId,
                message: message.trim(),
            })
        }
    }

    // Detectar '/' e mostrar autocomplete
    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        const cursorPos = e.target.selectionStart

        setMessage(value)

        // Verificar se '/' foi digitado e se é imediatamente após (não depois de outros caracteres)
        const textBeforeCursor = value.substring(0, cursorPos)
        const lastChar = cursorPos > 0 ? textBeforeCursor[cursorPos - 1] : ""
        const secondLastChar = cursorPos > 1 ? textBeforeCursor[cursorPos - 2] : ""

        // Verificar se '/' foi digitado agora (início da linha ou após espaço/quebra de linha)
        if (lastChar === "/" && (cursorPos === 1 || secondLastChar === " " || secondLastChar === "\n")) {
            // '/' foi digitado imediatamente após espaço ou início da linha
            setShowAutocomplete(true)
            setSlashPosition(cursorPos - 1)
            setSearchQuery("")
            setSelectedIndex(0)
        } else if (showAutocomplete && slashPosition !== null) {
            // Verificar se ainda estamos digitando após o '/'
            const textAfterSlash = textBeforeCursor.substring(slashPosition + 1)
            const expectedEndPos = slashPosition + 1 + textAfterSlash.length
            
            // Verificar se o cursor está exatamente onde deveria estar (não voltou para editar)
            if (cursorPos !== expectedEndPos) {
                // Cursor não está no final - usuário voltou para editar, cancelar autocomplete
                setShowAutocomplete(false)
                setSlashPosition(null)
                setSearchQuery("")
            } else {
                // Verificar se digitou caractere não alfanumérico
                if (textAfterSlash.length > 0) {
                    const lastCharAfterSlash = textAfterSlash[textAfterSlash.length - 1]
                    if (lastCharAfterSlash && /[^a-zA-Z0-9]/.test(lastCharAfterSlash)) {
                        // Digitou espaço ou outro caractere que não seja letra/número, cancelar
                        setShowAutocomplete(false)
                        setSlashPosition(null)
                        setSearchQuery("")
                        return
                    }
                }
                // Atualizar busca
                setSearchQuery(textAfterSlash ?? "")
                setSelectedIndex(0)
            }
        } else {
            // Se não há '/' relevante, esconder autocomplete
            if (showAutocomplete) {
                setShowAutocomplete(false)
                setSlashPosition(null)
                setSearchQuery("")
            }
        }
    }

    // Inserir comando selecionado
    const insertCommand = (command: CommandOption) => {
        if (slashPosition === null || !textareaRef.current) return
        
        const commandValue = command.value ?? ""
        if (!commandValue) return

        const beforeSlash = message.substring(0, slashPosition)
        const afterCursor = message.substring(textareaRef.current.selectionStart)
        
        const newMessage = `${beforeSlash}${commandValue} ${afterCursor}`
        setMessage(newMessage)
        setShowAutocomplete(false)
        setSlashPosition(null)
        setSearchQuery("")

        // Focar no textarea e posicionar cursor após o texto inserido
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPos = slashPosition + commandValue.length + 1
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
            }
        }, 0)
    }

    // Manipular teclas no textarea
    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showAutocomplete || filteredCommands.length === 0) {
            // Se não há autocomplete ativo, permitir comportamento padrão
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
            }
            return
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setSelectedIndex((prev) => 
                    prev < filteredCommands.length - 1 ? prev + 1 : 0
                )
                break
            case "ArrowUp":
                e.preventDefault()
                setSelectedIndex((prev) => 
                    prev > 0 ? prev - 1 : filteredCommands.length - 1
                )
                break
            case "Enter":
                e.preventDefault()
                if (selectedIndex >= 0 && selectedIndex < filteredCommands.length) {
                    const selectedCommand = filteredCommands[selectedIndex]
                    if (selectedCommand) {
                        insertCommand(selectedCommand)
                    }
                }
                break
            case "Escape":
                e.preventDefault()
                setShowAutocomplete(false)
                setSlashPosition(null)
                setSearchQuery("")
                break
            case " ":
                // Espaço cancela o autocomplete
                e.preventDefault()
                setShowAutocomplete(false)
                setSlashPosition(null)
                setSearchQuery("")
                // Inserir espaço normalmente
                const cursorPos = textareaRef.current?.selectionStart ?? 0
                const beforeCursor = message.substring(0, cursorPos)
                const afterCursor = message.substring(cursorPos)
                setMessage(beforeCursor + " " + afterCursor)
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.setSelectionRange(cursorPos + 1, cursorPos + 1)
                    }
                }, 0)
                break
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "NOT_STARTED":
                return <Badge variant="destructive">Não Iniciado</Badge>
            case "IN_PROGRESS":
                return <Badge variant="destructive">Em Progresso</Badge>
            case "COMPLETED":
                return <Badge variant="secondary">Concluído</Badge>
            default:
                return <Badge>Desconhecido</Badge>
        }
    }

    /**
     * Processa o texto da mensagem para converter formatos customizados em markdown válido
     * - ** {palavra} ** → **palavra** (negrito)
     * - _{palavra}_ → _palavra_ (itálico - já é markdown válido)
     * - \n → quebra de linha
     */
    const processMessageMarkdown = (text: string): string => {
        let processed = text

        // Converter ** {palavra} ** para **palavra** (negrito com espaços e chaves)
        processed = processed.replace(/\*\*\s*\{\s*([^}]+?)\s*\}\s*\*\*/g, "**$1**")

        // Converter \n literal para quebra de linha real
        processed = processed.replace(/\\n/g, "\n")

        return processed
    }

    if (isLoadingResponse) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[1000px] p-4 sm:p-6">
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!response) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[1000px] max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6">
                <DialogHeader className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <DialogTitle className="text-lg sm:text-xl break-words pr-2">{response.form.title}</DialogTitle>
                        <EditResponseButton
                            responseId={responseId}
                            formId={response.formId}
                            isOwner={true} // Na página kanban, o usuário é dono dos formulários
                            isAuthor={false}
                        />
                    </div>
                    <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        {getStatusBadge(response.status)}
                        <span className="text-xs sm:text-sm text-gray-500">
                            Enviado em {format(new Date(response.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarImage src={response.user.imageUrl ?? ""} />
                            <AvatarFallback>{response.user.firstName?.[0] ?? response.user.email[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">
                                {response.user.firstName
                                    ? `${response.user.firstName} ${response.user.lastName ?? ""}`
                                    : response.user.email}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{response.user.email}</p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="overflow-x-auto">
                        <ResponseDetails 
                            responseData={response.responses as Record<string, string | number | string[] | File[] | null | undefined>[]} 
                            formFields={response.form.fields as unknown as Field[]} 
                        />
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                        <h3 className="text-sm sm:text-base font-medium">Chat</h3>
                        <div className="max-h-[200px] sm:max-h-[300px] overflow-y-auto rounded-md border p-3 sm:p-4">
                            {isLoadingChat ? (
                                <div className="flex h-20 items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : chatMessages && chatMessages.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className="flex gap-2 sm:gap-3">
                                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                                                <AvatarImage src={msg.user.imageUrl ?? ""} />
                                                <AvatarFallback>{msg.user.firstName?.[0] ?? msg.user.email[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                    <p className="font-medium text-xs sm:text-sm truncate">
                                                        {msg.user.firstName ? `${msg.user.firstName} ${msg.user.lastName ?? ""}` : msg.user.email}
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
                    </div>
                </div>

                <DialogFooter className="mt-4 sm:mt-6">
                    <div className="flex w-full gap-2 relative">
                        <div className="flex-1 relative">
                            <Textarea
                                ref={textareaRef}
                                value={message}
                                onChange={handleMessageChange}
                                placeholder="Digite sua mensagem... (use / para comandos)"
                                className="flex-1 min-h-[60px] sm:min-h-[80px] text-sm sm:text-base"
                                onKeyDown={handleTextareaKeyDown}
                            />
                            {showAutocomplete && filteredCommands.length > 0 && (
                                <div
                                    ref={autocompleteRef}
                                    className="absolute bottom-full left-0 mb-2 w-full bg-background border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto"
                                >
                                    <div className="p-1">
                                        {filteredCommands.map((cmd, index) => (
                                            <button
                                                key={cmd.key}
                                                type="button"
                                                className={cn(
                                                    "w-full px-3 py-2 text-left rounded-sm text-sm transition-colors",
                                                    "hover:bg-accent hover:text-accent-foreground",
                                                    index === selectedIndex && "bg-accent text-accent-foreground"
                                                )}
                                                onClick={() => insertCommand(cmd)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">/{cmd.key}</span>
                                                    {cmd.description && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {cmd.description}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                                    {cmd.value}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
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
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
