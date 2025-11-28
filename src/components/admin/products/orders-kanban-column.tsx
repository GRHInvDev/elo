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
import type { RouterOutputs } from "@/trpc/react"

export type ProductOrderStatus = "SOLICITADO" | "EM_ANDAMENTO"

type KanbanOrder = RouterOutputs["productOrder"]["listKanban"][number]

export type ProductOrderWithRelations = KanbanOrder

interface OrdersKanbanColumnProps {
  title: string
  status: ProductOrderStatus
  orders: KanbanOrder[]
  onMarkAsRead: (orderId: string) => void
  onOrderSlotClick?: (order: KanbanOrder) => void
}

export function OrdersKanbanColumn({ title, status, orders, onMarkAsRead, onOrderSlotClick }: OrdersKanbanColumnProps) {
  const getStatusCurrentColor = (s: ProductOrderStatus) => {
    switch (s) {
      case "SOLICITADO":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-300/50 dark:text-blue-100"
      case "EM_ANDAMENTO":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-300/50 dark:text-yellow-100"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${getStatusCurrentColor(status)}`}>
      <h2 className="mb-2 text-xl font-semibold">{title} ({orders.length})</h2>

      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...({ ...provided.droppableProps } as React.HTMLAttributes<HTMLDivElement>)}
            className="flex min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto flex-col"
            style={{ gap: "0.75rem" }}
          >
            {orders.map((order, index) => (
              <Draggable key={order.id} draggableId={order.id} index={index}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.dragHandleProps}
                    {...dragProvided.draggableProps}
                    style={{ ...dragProvided.draggableProps.style, ...(snapshot.isDragging ? { pointerEvents: "none", zIndex: 50 } : {}) }}
                  >
                    <Card className={`bg-muted shadow-sm max-w-xs ${!order.read ? "ring-2 ring-primary" : ""}`}>
                      <CardHeader className="pb-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium leading-tight">
                            {(order.orderGroupId || (order as { _groupOrders?: typeof order[] })._groupOrders) ? "Pedido" : order.product.name}
                          </CardTitle>
                          {!order.read && (
                            <Badge variant="destructive" className="text-xs">Novo</Badge>
                          )}
                        </div>
                        {(order.orderGroupId || (order as { _groupOrders?: typeof order[] })._groupOrders) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {(() => {
                              const groupOrders = order.orderGroup?.orders ?? (order as { _groupOrders?: typeof order[] })._groupOrders ?? []
                              const count = groupOrders.length
                              return `${count} ${count === 1 ? 'item' : 'itens'}`
                            })()}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="pb-1 space-y-1">
                        {/* Imagem do produto - se for pedido agrupado, mostrar primeira imagem do primeiro produto do grupo */}
                        {(() => {
                          const groupOrders = order.orderGroup?.orders ?? (order as { _groupOrders?: typeof order[] })._groupOrders ?? []
                          const isGrouped = order.orderGroupId || groupOrders.length > 0
                          const imageUrl = isGrouped && groupOrders[0]?.product?.imageUrl
                            ? groupOrders[0].product.imageUrl
                            : order.product.imageUrl
                          const productName = isGrouped && groupOrders[0]?.product?.name
                            ? groupOrders[0].product.name
                            : order.product.name
                          
                          return imageUrl && imageUrl.length > 0 ? (
                            <div className="relative h-16 w-16 mx-auto rounded-md overflow-hidden border">
                              <Image
                                src={Array.isArray(imageUrl) ? imageUrl[0] ?? "/placeholder.svg" : "/placeholder.svg"}
                                alt={productName}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                          ) : null
                        })()}

                        {/* Informações do usuário */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={order.user.imageUrl ?? ""} />
                              <AvatarFallback className="text-xs">
                                {(order.user.firstName ? order.user.firstName[0] : order.user.email?.[0])?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs">
                              {order.user.firstName ? `${order.user.firstName} ${order.user.lastName ?? ""}` : order.user.email}
                            </span>
                          </div>
                        </div>

                        {/* Quantidade */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>Qty: {order.quantity}</span>
                        </div>

                        {/* Data */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CardTitle className="sr-only">Data</CardTitle>
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(order.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-1 pb-2 flex gap-1">
                        {!order.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              onMarkAsRead(order.id)
                            }}
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Lido
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOrderSlotClick?.(order)
                          }}
                        >
                          Detalhes
                        </Button>
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

