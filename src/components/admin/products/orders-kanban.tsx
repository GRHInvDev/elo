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

  // Group orders - pedidos do mesmo grupo OU criados juntos (mesmo usuário, mesma empresa, mesmo timestamp) são exibidos como um único pedido
  const groupedOrders = useMemo(() => {
    const groups = new Map<string, ProductOrderWithRelations[]>()
    const TIMESTAMP_TOLERANCE = 5 * 60 * 1000 // 5 minutos de tolerância para considerar "criados juntos"
    
    // Primeiro, agrupar por orderGroupId quando existir
    localOrders.forEach((order) => {
      if (order.orderGroupId) {
        const groupId = `group-${order.orderGroupId}`
        if (!groups.has(groupId)) {
          groups.set(groupId, [])
        }
        groups.get(groupId)!.push(order)
      }
    })
    
    // Depois, agrupar pedidos sem orderGroupId que foram criados juntos
    const ungroupedOrders = localOrders.filter(o => !o.orderGroupId)
    
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
    return Array.from(groups.entries()).map(([groupId, groupOrders]) => {
      // Ordenar por data de criação e pegar o primeiro
      const sorted = [...groupOrders].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      const representative = sorted[0]!
      
      // Adicionar os outros pedidos do grupo como uma propriedade customizada
      return {
        ...representative,
        _groupOrders: sorted // Pedidos do grupo para exibição
      }
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

