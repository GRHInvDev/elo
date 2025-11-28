"use client"

import { useState, useEffect, useMemo } from "react"
import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd"
import { Loader2 } from "lucide-react"
import { api } from "@/trpc/react"
import { OrdersKanbanColumn, type ProductOrderWithRelations, type ProductOrderStatus } from "./orders-kanban-column"
import { OrderDetailsModal } from "./order-details-modal"
// import type { RouterOutputs } from "@/trpc/react"

export function OrdersKanban() {
  const [localOrders, setLocalOrders] = useState<ProductOrderWithRelations[]>([])
  const [selectedOrder, setSelectedOrder] = useState<ProductOrderWithRelations | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const ordersQuery = api.productOrder.listKanban.useQuery(undefined, {
    enabled: true,
  })
  const orders: ProductOrderWithRelations[] = useMemo(
    () => (Array.isArray(ordersQuery.data) ? ordersQuery.data : []),
    [ordersQuery.data]
  )
  const isLoading = ordersQuery.isLoading
  const refetch = ordersQuery.refetch

  // Update local state when server data changes
  useEffect(() => {
    if (Array.isArray(orders)) {
      setLocalOrders(orders)
    }
  }, [orders])

  // Update status mutation
  const updateStatusMutation = api.productOrder.updateStatus.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  // Mark as read mutation
  const markAsReadMutation = api.productOrder.markAsRead.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  // Group orders by orderGroupId - pedidos do mesmo grupo são exibidos como um único pedido
  const groupedOrders = useMemo(() => {
    const groups = new Map<string | null, ProductOrderWithRelations[]>()
    
    // Agrupar pedidos por orderGroupId
    localOrders.forEach((order) => {
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
  }, [localOrders])

  // Group orders by status
  const columns = {
    SOLICITADO: groupedOrders.filter((order) => order.status === "SOLICITADO"),
    EM_ANDAMENTO: groupedOrders.filter((order) => order.status === "EM_ANDAMENTO"),
  }

  // Handle drag end
  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source, draggableId } = result

    // If dropped outside a droppable area
    if (!destination) return

    // If dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    // Update local state immediately for instant UI feedback
    setLocalOrders((prev) =>
      prev.map((order) => {
        if (order.id === draggableId) {
          return {
            ...order,
            status: destination.droppableId as ProductOrderStatus,
          }
        }
        return order
      }),
    )

    // Update the status in the database
    updateStatusMutation.mutate({
      id: draggableId,
      status: destination.droppableId as ProductOrderStatus,
    })
  }

  const handleMarkAsRead = (orderId: string) => {
    markAsReadMutation.mutate({ id: orderId })
  }

  const handleOrderClick = (order: ProductOrderWithRelations) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Verificar se não há pedidos ou se algum pedido tem status nulo
  if (!isLoading) {
    if (!Array.isArray(orders) || orders.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum pedido encontrado.</p>
        </div>
      )
    }
    
    // Verificar se algum pedido tem status nulo
    const hasNullStatus = orders.some((order) => {
      if (typeof order !== "object" || order === null) return false
      if (!("status" in order)) return false
      const orderWithStatus = order as { status: unknown }
      return orderWithStatus.status === null
    })
    
    if (hasNullStatus) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum pedido encontrado.</p>
        </div>
      )
    }
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OrdersKanbanColumn
            title="Solicitado"
            status="SOLICITADO"
            orders={columns.SOLICITADO}
            onMarkAsRead={handleMarkAsRead}
            onOrderSlotClick={handleOrderClick}
          />
          <OrdersKanbanColumn
            title="Em Andamento"
            status="EM_ANDAMENTO"
            orders={columns.EM_ANDAMENTO}
            onMarkAsRead={handleMarkAsRead}
            onOrderSlotClick={handleOrderClick}
          />
        </div>
      </DragDropContext>
      <OrderDetailsModal
        order={selectedOrder}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />
    </>
  )
}

