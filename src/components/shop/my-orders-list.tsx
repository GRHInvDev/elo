"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Package, CheckCircle2, Calendar } from "lucide-react"
import { api } from "@/trpc/react"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ProductOrderStatus } from "@/components/admin/products/orders-kanban-column"
import type { RouterOutputs } from "@/trpc/react"

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

export function MyOrdersList() {
  const ordersQuery = api.productOrder.listMyOrders.useQuery()
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

  // Type-safe orders extraction
  const rawOrders = ordersQuery.data
  const orders: MyOrder[] = Array.isArray(rawOrders) 
    ? rawOrders.filter(isMyOrder) 
    : []

  const getStatusBadge = (status: ProductOrderStatus) => {
    switch (status) {
      case "SOLICITADO":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Solicitado
          </Badge>
        )
      case "EM_COMPRA":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Em Compra
          </Badge>
        )
      case "EM_RETIRADA":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            Em Retirada
          </Badge>
        )
      case "ENTREGUE":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Entregue
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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
    <div className="space-y-4">
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
  const [imageError, setImageError] = useState(false)
  const imageUrl = order.product.imageUrl
  const firstImage = Array.isArray(imageUrl) && imageUrl.length > 0 ? imageUrl[0] : null

  return (
    <Card className={isUnread ? "ring-2 ring-primary" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{order.product.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{order.product.description}</p>
          </div>
          {isUnread && (
            <Badge variant="destructive" className="ml-2">Novo</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Imagem do produto */}
          <div className="relative h-24 w-24 rounded-md overflow-hidden border flex-shrink-0 bg-muted">
            {firstImage && typeof firstImage === "string" && firstImage.trim() !== "" && !imageError ? (
              <img
                src={`/api/image-proxy?url=${encodeURIComponent(firstImage)}`}
                alt={order.product.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => {
                  setImageError(true)
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Quantidade: {order.quantity}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>

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
    </Card>
  )
}
