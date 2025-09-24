"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, MessageCircle } from "lucide-react"
import { api } from "@/trpc/react"
import { useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { ImageUpload } from "./ImageUpload"
import { ImageMessage } from "./ImageMessage"
import { FileUpload } from "./FileUpload"
import { FileMessage } from "./FileMessage"

interface Message {
  id: string
  content: string | null
  createdAt: Date
  userId: string
  roomId: string
  groupId: string | null
  imageUrl: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
  group?: {
    id: string
    name: string
  } | null
}

interface ChatRoomProps {
  roomId?: string
  className?: string
}

export function ChatRoom({ roomId = "global", className }: ChatRoomProps) {
  const { user: clerkUser } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<{
    url: string
    name: string
    size: number
    type: string
  } | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)


  // Determinar o tipo de sala
  const isGroup = roomId.startsWith('group_')
  const isPrivate = roomId.startsWith('private_')

  // Para chats privados, extrair ID do outro usuário
  const otherUserId = isPrivate && clerkUser?.id
    ? (() => {
        // Extrair os IDs completos (formato: user_xxx)
        const idPattern = /user_[^_]+/g
        const matches = roomId.match(idPattern) ?? []
        const otherId = matches.find(id => id !== clerkUser.id)
        return otherId ?? null
      })()
    : null


  // Buscar informações do outro usuário em chats privados
  const { data: otherUser } = api.user.getById.useQuery(
    { id: otherUserId! },
    { enabled: !!otherUserId }
  )

  // Buscar mensagens recentes via tRPC
  const { data: recentMessages, isLoading } = api.chatMessage.getRecentMessages.useQuery({
    roomId,
    limit: 20,
  })


  // Query para carregar mais mensagens
  const loadMoreMessages = api.chatMessage.getMessages.useQuery(
    {
      roomId,
      limit: 20,
      offset: messages.length,
    },
    {
      enabled: false, // Só executar quando chamado manualmente
    }
  )

  // Contexto tRPC para invalidação de queries
  const trpcContext = api.useContext()

  // Polling para buscar novas mensagens
  useEffect(() => {
    if (!clerkUser?.id) return

    console.log('🔄 [FRONTEND] Iniciando polling para mensagens')

    // Simular conexão estabelecida (sempre "conectado" para polling)
    setIsConnected(true)

    // Polling para buscar novas mensagens a cada 3 segundos
    pollIntervalRef.current = setInterval(() => {
      void (async () => {
        try {
          const lastMessageId = messages.length > 0 ? messages[messages.length - 1]?.id ?? null : null

          const response = await fetch(`/api/chat/poll?roomId=${roomId}&lastMessageId=${lastMessageId ?? ''}`)
        if (response.ok) {
          const newMessages = await response.json() as Message[]
          if (newMessages.length > 0) {
            console.log('📨 [FRONTEND] Novas mensagens recebidas:', newMessages.length)
            setMessages(prev => {
              // Filtrar mensagens que já existem para evitar duplicatas
              const existingIds = new Set(prev.map(m => m.id))
              const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id))
              return [...prev, ...uniqueNewMessages]
            })

            // Invalidar query de conversas ativas quando mensagens são recebidas
            void trpcContext.chatMessage.getActiveConversations.invalidate()
          }
        }
        } catch (error) {
          console.error('❌ [FRONTEND] Erro no polling:', error)
          setIsConnected(false)
        }
      })()
    }, 5000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      setIsConnected(false)
      setIsTyping(false)
    }
  }, [clerkUser?.id, roomId, messages, trpcContext.chatMessage.getActiveConversations])

  // Carregar mensagens iniciais
  useEffect(() => {
    if (recentMessages) {
      setMessages(recentMessages as unknown as Message[])
      setHasMoreMessages(recentMessages.length === 20) // Se recebeu 20 mensagens, provavelmente há mais
    }
  }, [recentMessages])

  // Função para carregar mais mensagens
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreMessages) return

    setIsLoadingMore(true)
    try {
      const result = await loadMoreMessages.refetch()
      if (result.data) {
        const newMessages = result.data
        if (newMessages.length === 0) {
          setHasMoreMessages(false)
        } else {
          // Adicionar mensagens antigas no início (ordem cronológica)
          setMessages(prev => [...newMessages.reverse(), ...prev])
          setHasMoreMessages(newMessages.length === 20)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mais mensagens:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Handler para scroll (carregar mais mensagens quando chegar no topo)
  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return

    // Se o usuário scrollou para o topo (com tolerância de 100px)
    if (container.scrollTop <= 100) {
      handleLoadMore().catch(console.error)
    }
  }

  // Scroll automático para a última mensagem (apenas para novas mensagens)
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      // Scroll apenas dentro do container de mensagens
      const container = messagesContainerRef.current
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [messages.length, isLoadingMore])

  // Mutation para enviar mensagem
  const sendMessageMutation = api.chatMessage.sendMessage.useMutation()

  // Enviar mensagem
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação: deve ter pelo menos texto, imagem ou arquivo
    if ((!inputMessage.trim() && !selectedImageUrl && !selectedFile) || !clerkUser?.id) return

    console.log('📤 [ChatRoom] Enviando mensagem para roomId:', roomId, 'userId:', clerkUser.id)

    try {
      const content = inputMessage.trim() || ""
      await sendMessageMutation.mutateAsync({
        content,
        roomId,
        fileUrl: selectedFile?.url,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        fileType: selectedFile?.type,
      })

      console.log('✅ [ChatRoom] Mensagem enviada com sucesso para roomId:', roomId)
      setInputMessage("")
      setSelectedImageUrl(null)
      setSelectedFile(null)
      setIsTyping(false) // Parar de mostrar indicador de digitação

      // Limpar timeout de digitação
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      // Invalidar query de conversas ativas para atualização imediata na sidebar
      await trpcContext.chatMessage.getActiveConversations.invalidate()
    } catch (error) {
      console.error('❌ [ChatRoom] Erro ao enviar mensagem:', error)
    }
  }

  // Indicador de digitação
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
    }

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Definir novo timeout para parar de mostrar "digitando" após 3 segundos
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 3000)
  }

  // Formatar nome do usuário
  const formatUserName = (user: Message['user'] | { firstName: string | null; lastName: string | null }) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    }
    return 'Usuário'
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="text-center">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Carregando chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full border rounded-lg", className)}>
      {/* Header do Chat */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium">
            {isGroup
              ? `Grupo: ${messages[0]?.group?.name ?? 'Carregando...'}`
              : isPrivate
                ? otherUser
                  ? formatUserName(otherUser)
                  : 'Carregando...'
                : 'Chat Global'
            }
          </span>
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div
        ref={messagesContainerRef}
        className="flex-1 p-3 overflow-y-auto min-h-0"
        onScroll={handleScroll}
      >
        {/* Indicador de carregamento no topo */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.userId === clerkUser?.id ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={message.user.imageUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {formatUserName(message.user).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "flex flex-col max-w-[70%]",
                  message.userId === clerkUser?.id ? "items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatUserName(message.user)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm break-words space-y-2",
                    message.userId === clerkUser?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {/* Conteúdo de texto */}
                  {message.content && (
                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>
                  )}

                  {/* Imagem anexada */}
                  {message.imageUrl && (
                    <div className="mt-2">
                      <ImageMessage
                        imageUrl={message.imageUrl}
                        alt="Imagem da mensagem"
                        maxWidth={200}
                        maxHeight={200}
                      />
                    </div>
                  )}

                  {/* Arquivo anexado */}
                  {message.fileUrl && (
                    <div className="mt-2">
                      <FileMessage
                        fileUrl={message.fileUrl}
                        fileName={message.fileName ?? 'Arquivo'}
                        fileSize={message.fileSize ?? 0}
                        fileType={message.fileType ?? 'application/octet-stream'}
                      />
                    </div>
                  )}

                  {/* Placeholder se não há conteúdo nem anexos */}
                  {!message.content && !message.imageUrl && !message.fileUrl && (
                    <div className="text-muted-foreground italic">
                      [Mensagem vazia]
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}


          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Indicador de Digitação */}
      {isTyping && (
        <div className="px-4 py-2 border-t bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>Você está digitando...</span>
          </div>
        </div>
      )}

      {/* Formulário de Envio - Sempre na parte inferior */}
      <div className="border-t bg-background/95 backdrop-blur-sm flex-shrink-0 mt-auto">
        <form onSubmit={sendMessage} className="p-4 space-y-3">
          {/* Preview da imagem selecionada */}
          {selectedImageUrl && (
            <div className="flex justify-center">
              <ImageUpload
                onImageUploaded={() => undefined} // Já foi feito no onImageUploaded
                onRemove={() => setSelectedImageUrl(null)}
                className="max-w-xs"
              />
            </div>
          )}

          {/* Preview do arquivo selecionado */}
          {selectedFile && (
            <div className="flex justify-center">
              <FileUpload
                onFileUploaded={() => undefined} // Já foi feito no onFileUploaded
                onRemove={() => setSelectedFile(null)}
                className="max-w-xs"
              />
            </div>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value)
                  handleTyping()
                }}
                placeholder="Digite sua mensagem..."
                className="min-h-[44px] resize-none"
                maxLength={2000}
                disabled={!isConnected}
              />
            </div>

            <ImageUpload
              onImageUploaded={setSelectedImageUrl}
              disabled={!isConnected}
              className="flex-shrink-0 mb-1"
            />

            <FileUpload
              onFileUploaded={setSelectedFile}
              disabled={!isConnected}
              className="flex-shrink-0 mb-1"
            />

            <Button
              type="submit"
              size="default"
              disabled={(!inputMessage.trim() && !selectedImageUrl && !selectedFile) || !isConnected}
              className="h-[44px] px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
