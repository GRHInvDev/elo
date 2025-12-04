"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Package, CheckCircle2, Calendar, Trash2, Clock, HelpCircle } from "lucide-react"
import { api } from "@/trpc/react"
import { formatDistanceToNow, format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ProductOrderStatus } from "@/components/admin/products/orders-kanban-column"
import type { RouterOutputs } from "@/trpc/react"
import Image from "next/image"
import { OrderChat } from "@/components/shop/order-chat"
import { OrderDoubtsModal } from "@/components/shop/order-doubts-modal"
import { useAccessControl } from "@/hooks/use-access-control"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

type MyOrder = RouterOutputs["productOrder"]["listMyOrders"][number]

function isMyOrder(order: unknown): order is MyOrder {
  return (
    typeof order === "object" &&
    order !== null &&
    "id" in order &&
    "read" in order &&
    "product" in order &&
    typeof (order as { read: unknown }).read === "boolean"
  )
}

export function MyOrdersList({ filter, showDeleteButton = false }: { filter?: string; showDeleteButton?: boolean }) {
  const utils = api.useUtils()
  const ordersQuery = api.productOrder.listMyOrders.useQuery(undefined, {
    staleTime: 2 * 60 * 1000, // 2 minutos - pedidos mudam com frequência
    gcTime: 5 * 60 * 1000, // 5 minutos
  })
  const isLoading = ordersQuery.isLoading
  const refetch = ordersQuery.refetch

  const markAsReadMutation = api.productOrder.markMyOrderAsRead.useMutation({
    onSuccess: async () => {
      await utils.productOrder.listMyOrders.invalidate()
      void refetch()
    },
  })

  const deleteOrderMutation = api.productOrder.deleteOrder.useMutation({
    onSuccess: async () => {
      await utils.productOrder.listMyOrders.invalidate()
      await utils.productOrder.listMyPendingGroups.invalidate()
      await utils.product.getAll.invalidate()
      void refetch()
      toast.success("Pedido deletado com sucesso")
    },
    onError: (error) => {
      toast.error(`Erro ao deletar pedido: ${error.message}`)
    },
  })

  const handleMarkAsRead = (orderId: string) => {
    markAsReadMutation.mutate({ id: orderId })
  }

  const handleDeleteOrder = (orderId: string) => {
    deleteOrderMutation.mutate({ id: orderId })
  }

  // Agrupar pedidos - pedidos do mesmo grupo OU criados juntos (mesmo usuário, mesma empresa, mesmo timestamp) são exibidos como um único pedido
  const groupedOrders = useMemo(() => {
    // Type-safe orders extraction e filtragem
  const rawOrders = ordersQuery.data
  const allOrders: MyOrder[] = Array.isArray(rawOrders)
    ? rawOrders.filter(isMyOrder).filter((o) => {
      if (filter && filter !== "ALL") {
        return o.status === filter;
      }
      return true;
    })
    : [];

    const groups = new Map<string, MyOrder[]>()
    const TIMESTAMP_TOLERANCE = 5 * 60 * 1000 // 5 minutos de tolerância para considerar "criados juntos"
    
    // Primeiro, agrupar por orderGroupId quando existir
    allOrders.forEach((order) => {
      if (order.orderGroupId) {
        const groupId = `group-${order.orderGroupId}`
      if (!groups.has(groupId)) {
        groups.set(groupId, [])
      }
      groups.get(groupId)!.push(order)
      }
    })
    
    // Depois, agrupar pedidos sem orderGroupId que foram criados juntos
    const ungroupedOrders = allOrders.filter(o => !o.orderGroupId)
    
    ungroupedOrders.forEach((order) => {
      // Tentar encontrar um grupo existente para este pedido
      // (mesmo usuário, mesma empresa do produto, timestamp próximo)
      let foundGroup = false
      const orderTimestamp = new Date(order.createdAt).getTime()
      const orderEnterprise = order.product.enterprise
      
      for (const [groupId, groupOrders] of groups.entries()) {
        // Só agrupar se não for um grupo com orderGroupId
        if (groupId.startsWith('group-')) continue
        
        const firstOrder = groupOrders[0]
        if (!firstOrder) continue
        
        const firstTimestamp = new Date(firstOrder.createdAt).getTime()
        const firstEnterprise = firstOrder.product.enterprise
        const timeDiff = Math.abs(orderTimestamp - firstTimestamp)
        
        // Mesmo usuário, mesma empresa, criados juntos (dentro da tolerância)
        if (
          order.userId === firstOrder.userId &&
          orderEnterprise === firstEnterprise &&
          timeDiff <= TIMESTAMP_TOLERANCE
        ) {
          groups.get(groupId)!.push(order)
          foundGroup = true
          break
        }
      }
      
      // Se não encontrou grupo, criar um novo
      if (!foundGroup) {
        const newGroupId = `time-${new Date(order.createdAt).getTime()}-${order.userId}-${orderEnterprise}`
        groups.set(newGroupId, [order])
      }
    })
    
    // Retornar o primeiro pedido de cada grupo como representante, mas com informação dos outros pedidos
    return Array.from(groups.entries()).map(([_groupId, groupOrders]) => {
      // Ordenar por data de criação e pegar o primeiro
      const sorted = [...groupOrders].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      const representative = sorted[0]!
      
      // Adicionar os outros pedidos do grupo como uma propriedade customizada
      // Isso permite que o OrderCard acesse todos os pedidos do grupo
      return {
        ...representative,
        _groupOrders: sorted // Pedidos do grupo para exibição
      }
    })
  }, [ordersQuery.data, filter])

  const orders = groupedOrders

  const getStatusBadge = (status: ProductOrderStatus) => {
    switch (status) {
      case "SOLICITADO":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Solicitado
          </Badge>
        )
      case "EM_ANDAMENTO":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Em Andamento
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  if (isLoading) {
    const skeletonItems = Array.from({ length: 4 });
    return (
      <div className="space-y-4">
        {skeletonItems.map((_, i) => (
          <Card key={i} className="animate-pulse w-full">
            <CardHeader>
              <div className="h-4 w-1/3 bg-muted rounded mb-2" />
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Você ainda não fez nenhum pedido.</p>
        <p className="text-sm mt-2">Explore os produtos disponíveis e faça seu primeiro pedido!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 overflow-y-auto w-full">
      {orders.map((order) => {
        const isUnread = order.read === false
        return (
          <OrderCard
            key={order.id}
            order={order}
            isUnread={isUnread}
            onMarkAsRead={handleMarkAsRead}
            markAsReadMutation={markAsReadMutation}
            getStatusBadge={getStatusBadge}
            onDeleteOrder={handleDeleteOrder}
            deleteOrderMutation={deleteOrderMutation}
            showDeleteButton={showDeleteButton}
          />
        )
      })}
    </div>
  )
}

function OrderCard({
  order,
  isUnread,
  onMarkAsRead,
  markAsReadMutation,
  getStatusBadge,
  onDeleteOrder,
  deleteOrderMutation,
  showDeleteButton = false
}: {
  order: MyOrder & { _groupOrders?: MyOrder[] }
  isUnread: boolean
  onMarkAsRead: (id: string) => void
  markAsReadMutation: ReturnType<typeof api.productOrder.markMyOrderAsRead.useMutation>
  getStatusBadge: (status: ProductOrderStatus) => JSX.Element
  onDeleteOrder: (id: string) => void
  deleteOrderMutation: ReturnType<typeof api.productOrder.deleteOrder.useMutation>
  showDeleteButton?: boolean
}) {
  const [showChat, setShowChat] = useState(false)
  const [showDoubtsModal, setShowDoubtsModal] = useState(false)
  const { canManageProducts, isSudo } = useAccessControl()
  const isAdmin = canManageProducts() || isSudo

  const utils = api.useUtils()

  // Buscar notificações não lidas do chat para este pedido
  const { data: unreadChatCount = 0 } = api.productOrder.countChatNotifications.useQuery(
    { orderId: order.id },
    { enabled: !!order.id, refetchInterval: 5000 }
  )

  // Mutation para marcar notificações do chat como lidas
  const markChatNotificationsAsRead = api.productOrder.markChatNotificationsAsRead.useMutation({
    onSuccess: () => {
      // Invalida a query para atualizar o contador
      void utils.productOrder.countChatNotifications.invalidate({ orderId: order.id })
    }
  })

  // Marcar como lido automaticamente quando o chat for aberto
  useEffect(() => {
    if (showChat && unreadChatCount > 0) {
      markChatNotificationsAsRead.mutate({ orderId: order.id })
    }
  }, [showChat, unreadChatCount, order.id, markChatNotificationsAsRead])

  // Verificar se é um pedido agrupado
  const isGroupedOrder = !!order.orderGroupId || !!(order as { _groupOrders?: MyOrder[] })._groupOrders
  
  // Extrair _groupOrders para usar nas dependências
  const orderGroupOrdersFromOrder = (order as { _groupOrders?: MyOrder[] })._groupOrders
  
  // Memoizar orderGroupOrders para evitar recriação a cada render
  const orderGroupOrders = useMemo(() => {
    return order.orderGroup?.orders ?? orderGroupOrdersFromOrder ?? []
  }, [order.orderGroup?.orders, orderGroupOrdersFromOrder])
  
  // Coletar todas as imagens de todos os produtos do pedido
  const allImages = useMemo(() => {
    const images: string[] = []
    
    if (isGroupedOrder && orderGroupOrders.length > 0) {
      // Para pedidos agrupados, coletar imagens de todos os produtos
      orderGroupOrders.forEach((o) => {
        if ('product' in o && o.product?.imageUrl) {
          const productImages = Array.isArray(o.product.imageUrl) 
            ? o.product.imageUrl 
            : [o.product.imageUrl]
          productImages.forEach((img) => {
            if (typeof img === 'string' && img.trim() !== '' && !images.includes(img)) {
              images.push(img)
            }
          })
        }
      })
    } else {
      // Para pedido único, coletar todas as imagens do produto
      const productImages = Array.isArray(order.product.imageUrl)
        ? order.product.imageUrl
        : order.product.imageUrl ? [order.product.imageUrl] : []
      productImages.forEach((img) => {
        if (typeof img === 'string' && img.trim() !== '') {
          images.push(img)
        }
      })
    }
    
    return images
  }, [isGroupedOrder, orderGroupOrders, order.product.imageUrl])

  // Estado para controlar o índice da imagem atual no carrossel mobile
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Resetar índice quando as imagens mudarem
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [allImages.length])

  // Carrossel automático em mobile (muda a cada 5 segundos)
  useEffect(() => {
    if (allImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    }, 5000) // 5 segundos

    return () => clearInterval(interval)
  }, [allImages.length])

  // Handler para clique no card (apenas mobile)
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Verificar se estamos em mobile (largura < 640px = sm breakpoint)
    if (window.innerWidth >= 640) {
      return
    }

    // Não abrir modal se clicar em botões, links ou elementos interativos
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('.order-chat') ||
      target.closest('[data-no-click]')
    ) {
      return
    }
    
    e.stopPropagation()
    setShowDoubtsModal(true)
  }

  return (
    <>
      <Card 
        className={`${isUnread ? "ring-2 ring-primary" : ""} w-full sm:cursor-default cursor-pointer`}
        onClick={handleCardClick}
      >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm">
              {isGroupedOrder ? `Pedido (${orderGroupOrders.length} ${orderGroupOrders.length === 1 ? 'item' : 'itens'})` : order.product.name}
            </CardTitle>
            {!isGroupedOrder && (
              <p className="text-sm text-muted-foreground mt-1">{order.product.description}</p>
            )}
            {isGroupedOrder && (
              <p className="text-sm text-muted-foreground mt-1">
                {orderGroupOrders.map((o, idx) => (
                  <span key={o.id}>
                    {o.product.name} ({o.quantity}x){idx < orderGroupOrders.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            )}
          </div>
          {isUnread && (
            <Badge variant="destructive" className="ml-2">Novo</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Galeria de imagens */}
          {allImages.length > 0 ? (
            <>
              {/* Mobile: Carrossel automático */}
              <div className="relative h-48 w-full sm:hidden rounded-md overflow-hidden border flex-shrink-0 bg-muted">
                <Image
                  key={currentImageIndex}
                  src={allImages[currentImageIndex]!}
                  alt={`${order.product.name} - Imagem ${currentImageIndex + 1}`}
                  fill
                  className="object-cover transition-opacity duration-500"
                  sizes="100%"
                  onError={() => {
                    // Fallback será tratado pelo Image do Next.js
                  }}
                />
                {/* Indicadores de posição */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'w-6 bg-primary'
                            : 'w-1.5 bg-primary/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop: Grid de todas as imagens */}
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {allImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative h-24 w-full rounded-md overflow-hidden border flex-shrink-0 bg-muted"
                  >
                    <Image
                      src={img}
                      alt={`${order.product.name} - Imagem ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      onError={() => {
                        // Fallback será tratado pelo Image do Next.js
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="relative h-48 w-full sm:h-24 sm:w-24 mb-4 sm:mb-0 rounded-md overflow-hidden border flex-shrink-0 bg-muted">
              <div className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground">
                <Package className="h-8 w-8 opacity-50" />
              </div>
            </div>
          )}

          {/* Informações do pedido */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-4">
              {!isGroupedOrder && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Quantidade: {order.quantity}</span>
                </div>
              )}
              {isGroupedOrder && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Total: {orderGroupOrders.reduce((sum, o) => sum + o.quantity, 0)} itens</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
            {/* Previsão de retirada */}
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Clock className="h-4 w-4" />
              <span>
                Previsão de retirada: {format(addDays(new Date(order.orderTimestamp ?? order.createdAt), 1), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {isGroupedOrder && (
              <div className="text-sm font-semibold text-primary">
                Total: R$ {orderGroupOrders.reduce((total, o) => total + (o.product.price * o.quantity), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                {getStatusBadge(order.status as ProductOrderStatus)}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(order.updatedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>

              {isUnread && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkAsRead(order.id)}
                  disabled={markAsReadMutation.isPending}
                >
                  {markAsReadMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Marcar como lido
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowChat((v) => !v)}>
                {showChat ? "Fechar chat" : "Chat com atendimento"}
              </Button>
              {unreadChatCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </Badge>
              )}
            </div>
            {/* Botão de dúvidas - apenas em desktop */}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowDoubtsModal(true)
              }}
              className="hidden sm:flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Dúvidas sobre o pedido
            </Button>
          </div>
          {showDeleteButton && isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteOrderMutation.isPending}
                >
                  {deleteOrderMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Deletar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar este pedido? Esta ação não pode ser desfeita.
                    {order.orderGroupId && (
                      <span className="block mt-2 font-semibold text-destructive">
                        Atenção: Este pedido faz parte de um grupo. O estoque será restaurado.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteOrder(order.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deletando...
                      </>
                    ) : (
                      "Deletar"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        {showChat && (
          <div className="mt-3 order-chat">
            <OrderChat orderId={order.id} />
          </div>
        )}
      </div>
    </Card>
    <OrderDoubtsModal
      open={showDoubtsModal}
      onOpenChange={setShowDoubtsModal}
    />
    </>
  )
}
