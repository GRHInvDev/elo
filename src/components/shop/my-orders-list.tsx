"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Package, CheckCircle2, Calendar } from "lucide-react"
import { api } from "@/trpc/react"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ProductOrderStatus } from "@/components/admin/products/orders-kanban-column"
import type { RouterOutputs } from "@/trpc/react"
import Image from "next/image"
import { OrderChat } from "@/components/shop/order-chat"

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

export function MyOrdersList({ filter }: { filter?: string }) {
  const ordersQuery = api.productOrder.listMyOrders.useQuery(undefined, {
    staleTime: 2 * 60 * 1000, // 2 minutos - pedidos mudam com frequência
    gcTime: 5 * 60 * 1000, // 5 minutos
  })
  const isLoading = ordersQuery.isLoading
  const refetch = ordersQuery.refetch

  const markAsReadMutation = api.productOrder.markMyOrderAsRead.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  const handleMarkAsRead = (orderId: string) => {
    markAsReadMutation.mutate({ id: orderId })
  }

  // Type-safe orders extraction e agrupamento por orderGroupId
  const rawOrders = ordersQuery.data
  const allOrders: MyOrder[] = Array.isArray(rawOrders)
    ? rawOrders.filter(isMyOrder).filter((o) => {
      if (filter && filter !== "ALL") {
        return o.status === filter;
      }
      return true;
    })
    : [];

  // Agrupar pedidos por orderGroupId - pedidos do mesmo grupo são exibidos como um único pedido
  const groupedOrders = useMemo(() => {
    const groups = new Map<string | null, MyOrder[]>()
    
    // Agrupar pedidos por orderGroupId
    allOrders.forEach((order) => {
      const groupId = order.orderGroupId ?? `single-${order.id}`
      if (!groups.has(groupId)) {
        groups.set(groupId, [])
      }
      groups.get(groupId)!.push(order)
    })
    
    // Retornar apenas o primeiro pedido de cada grupo como representante
    // (os outros pedidos do grupo serão exibidos nos detalhes)
    return Array.from(groups.values()).map((groupOrders) => {
      // Ordenar por data de criação e pegar o primeiro
      const sorted = [...groupOrders].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      return sorted[0]!
    })
  }, [allOrders])

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
  getStatusBadge
}: {
  order: MyOrder
  isUnread: boolean
  onMarkAsRead: (id: string) => void
  markAsReadMutation: ReturnType<typeof api.productOrder.markMyOrderAsRead.useMutation>
  getStatusBadge: (status: ProductOrderStatus) => JSX.Element
}) {
  const [showChat, setShowChat] = useState(false)
  const imageUrl = order.product.imageUrl
  const firstImage = Array.isArray(imageUrl) && imageUrl.length > 0 ? imageUrl[0] : null

  // Verificar se é um pedido agrupado
  const isGroupedOrder = !!order.orderGroupId
  const orderGroupOrders = order.orderGroup?.orders ?? []

  return (
    <Card className={`${isUnread ? "ring-2 ring-primary" : ""} w-full`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
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
          {/* Imagem do produto (expansiva) */}
          <div className="relative h-48 w-full sm:h-24 sm:w-24 mb-4 sm:mb-0 rounded-md overflow-hidden border flex-shrink-0 bg-muted">
            {firstImage && typeof firstImage === "string" && firstImage.trim() !== "" ? (
              <Image
                src={firstImage}
                alt={order.product.name}
                fill
                className="object-cover"
                sizes="100%"
                onError={() => {
                  // Fallback será tratado pelo Image do Next.js
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground">
                <Package className="h-8 w-8 opacity-50" />
              </div>
            )}
          </div>

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
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setShowChat((v) => !v)}>
            {showChat ? "Fechar chat" : "Chat com atendimento"}
          </Button>
        </div>
        {showChat && (
          <div className="mt-3">
            <OrderChat orderId={order.id} />
          </div>
        )}
      </div>
    </Card>
  )
}
