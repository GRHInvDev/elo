"use client"

import { useState, useEffect, useRef } from "react"
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
import { type Field } from "@/lib/form-types"

interface ResponseDialogProps {
    responseId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ResponseDialog({ responseId, open, onOpenChange }: ResponseDialogProps) {
    const [message, setMessage] = useState("")
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Fetch response details
    const { data: response, isLoading: isLoadingResponse } = api.formResponse.getById.useQuery(
        { responseId },
        { enabled: open },
    )

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
        },
    })

    // Scroll to bottom of chat when new messages arrive
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [chatMessages])

    const handleSendMessage = () => {
        if (message.trim() && responseId) {
            sendMessageMutation.mutate({
                responseId,
                message: message.trim(),
            })
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

    if (isLoadingResponse) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px]">
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
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{response.form.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                        {getStatusBadge(response.status)}
                        <span className="text-sm text-gray-500">
                            Enviado em {format(new Date(response.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <Avatar>
                            <AvatarImage src={response.user.imageUrl ?? ""} />
                            <AvatarFallback>{response.user.firstName?.[0] ?? response.user.email[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">
                                {response.user.firstName
                                    ? `${response.user.firstName} ${response.user.lastName ?? ""}`
                                    : response.user.email}
                            </p>
                            <p className="text-sm text-gray-500">{response.user.email}</p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <ResponseDetails 
                        responseData={response.responses as Record<string, string | number | string[] | File[] | null | undefined>[]} 
                        formFields={response.form.fields as unknown as Field[]} 
                    />

                    <Separator className="my-4" />

                    <h3 className="mb-2 font-medium">Chat</h3>
                    <div className="max-h-[200px] overflow-y-auto rounded-md border p-4">
                        {isLoadingChat ? (
                            <div className="flex h-20 items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : chatMessages && chatMessages.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={msg.user.imageUrl ?? ""} />
                                            <AvatarFallback>{msg.user.firstName?.[0] ?? msg.user.email[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">
                                                    {msg.user.firstName ? `${msg.user.firstName} ${msg.user.lastName ?? ""}` : msg.user.email}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="mt-1">{msg.message}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">Nenhuma mensagem ainda.</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <div className="flex w-full gap-2">
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                        />
                        <Button onClick={handleSendMessage} disabled={!message.trim() || sendMessageMutation.isPending}>
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
