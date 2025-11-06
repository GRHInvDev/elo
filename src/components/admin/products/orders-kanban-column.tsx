"use client"

import { Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Package, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"

export type ProductOrderStatus = "SOLICITADO" | "EM_COMPRA" | "EM_RETIRADA" | "ENTREGUE"

export interface ProductOrderWithRelations {
  id: string
  userId: string
  productId: string
  quantity: number
  status: ProductOrderStatus
  read: boolean
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
  }
  product: {
    id: string
    name: string
    description: string
    price: number
    imageUrl: string[]
    enterprise: string
  }
}

interface OrdersKanbanColumnProps {
  title: string
  status: ProductOrderStatus
  orders: ProductOrderWithRelations[]
  onMarkAsRead: (orderId: string) => void
}

export function OrdersKanbanColumn({ title, status, orders, onMarkAsRead }: OrdersKanbanColumnProps) {
  const getStatusColor = (status: ProductOrderStatus) => {
    switch (status) {
      case "SOLICITADO":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-300/50 dark:text-blue-100"
      case "EM_COMPRA":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-300/50 dark:text-yellow-100"
      case "EM_RETIRADA":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-300/50 dark:text-orange-100"
      case "ENTREGUE":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-300/50 dark:text-green-100"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor(status)}`}>
      <h2 className="mb-4 text-xl font-semibold">{title} ({orders.length})</h2>

      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex min-h-[600px] max-h-[calc(100vh-300px)] overflow-y-auto flex-col gap-3"
          >
            {orders.map((order, index) => (
              <Draggable key={order.id} draggableId={order.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <Card className={`bg-muted shadow-sm ${!order.read ? "ring-2 ring-primary" : ""}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-medium">
                            {order.product.name}
                          </CardTitle>
                          {!order.read && (
                            <Badge variant="destructive" className="text-xs">Novo</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 space-y-2">
                        {/* Imagem do produto */}
                        {order.product.imageUrl && order.product.imageUrl.length > 0 && (
                          <div className="relative h-24 w-full rounded-md overflow-hidden border">
                            <Image
                              src={order.product.imageUrl[0] ?? "/placeholder.svg"}
                              alt={order.product.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 200px"
                            />
                          </div>
                        )}

                        {/* Informações do usuário */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={order.user.imageUrl ?? ""} />
                              <AvatarFallback>
                                {order.user.firstName?.[0] ?? order.user.email[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {order.user.firstName
                                ? `${order.user.firstName} ${order.user.lastName ?? ""}`
                                : order.user.email}
                            </span>
                          </div>
                        </div>

                        {/* Quantidade */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>Quantidade: {order.quantity}</span>
                        </div>

                        {/* Data */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(order.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        {!order.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              onMarkAsRead(order.id)
                            }}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Marcar como lido
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

