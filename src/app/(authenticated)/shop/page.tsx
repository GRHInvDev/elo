"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import ProductGrid from "@/components/shop/product-grid"
import { MyOrdersList } from "@/components/shop/my-orders-list"
import ShoppingCart from "@/components/shop/shopping-cart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingBag, ShoppingCart as ShoppingCartIcon } from "lucide-react"
import { api } from "@/trpc/react"
import type { RouterOutputs } from "@/trpc/react"
import React, { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CartProvider } from "@/contexts/cart-context"
import { useCart } from "@/hooks/use-cart"

type MyOrder = RouterOutputs["productOrder"]["listMyOrders"][number]

function isMyOrder(order: unknown): order is MyOrder {
  return (
    typeof order === "object" &&
    order !== null &&
    "id" in order &&
    "read" in order &&
    typeof (order as { read: unknown }).read === "boolean"
  )
}

/**
 * Agrupa pedidos usando a mesma lógica do MyOrdersList
 * - Agrupa por orderGroupId quando existir
 * - Para pedidos sem orderGroupId, agrupa por timestamp próximo (5min), mesmo usuário e mesma empresa
 */
function groupOrders(orders: MyOrder[]): MyOrder[][] {
  const groups = new Map<string, MyOrder[]>()
  const TIMESTAMP_TOLERANCE = 5 * 60 * 1000 // 5 minutos de tolerância

  // Primeiro, agrupar por orderGroupId quando existir
  orders.forEach((order) => {
    if (order.orderGroupId) {
      const groupId = `group-${order.orderGroupId}`
      if (!groups.has(groupId)) {
        groups.set(groupId, [])
      }
      groups.get(groupId)!.push(order)
    }
  })

  // Depois, agrupar pedidos sem orderGroupId que foram criados juntos
  const ungroupedOrders = orders.filter(o => !o.orderGroupId)

  ungroupedOrders.forEach((order) => {
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

  return Array.from(groups.values())
}

/**
 * Conta pedidos não lidos agrupados (não itens individuais)
 * Um pedido agrupado é considerado não lido se pelo menos um item do grupo não foi lido
 */
function getUnreadCount(orders: unknown): number {
  if (!Array.isArray(orders)) return 0

  const allOrders: MyOrder[] = orders.filter(isMyOrder)
  if (allOrders.length === 0) return 0

  // Agrupar pedidos usando a mesma lógica do MyOrdersList
  const groupedOrders = groupOrders(allOrders)

  // Contar grupos que têm pelo menos um item não lido
  let count = 0
  for (const group of groupedOrders) {
    // Se pelo menos um item do grupo não foi lido, o pedido agrupado é não lido
    const hasUnread = group.some(order => order.read === false)
    if (hasUnread) {
      count++
    }
  }

  return count
}

function ShopPageContent() {
  // Contar pedidos não lidos do usuário
  const ordersQuery = api.productOrder.listMyOrders.useQuery(undefined, {
    staleTime: 2 * 60 * 1000, // 2 minutos - pedidos mudam com frequência
  })
  const myOrders = ordersQuery.data
  const { enterprise: cartEnterprise, totalItems } = useCart()

  // Se há itens no carrinho, filtrar apenas produtos da mesma empresa
  const [enterprise, setEnterprise] = useState<"ALL" | "Box" | "RHenz" | "Cristallux" | "Box_Filial" | "Cristallux_Filial">("ALL");
  const [orderFilter, setOrderFilter] = useState<"ALL" | "SOLICITADO" | "EM_ANDAMENTO" | "CONCLUIDO">("ALL");

  const unreadCount = getUnreadCount(myOrders)
  const cartItemCount = totalItems ?? 0

  // Atualizar filtro quando empresa do carrinho muda
  React.useEffect(() => {
    if (cartEnterprise) {
      setEnterprise(cartEnterprise as typeof enterprise)
    }
  }, [cartEnterprise])

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Lojinha RHenz
          </h1>
          <h2 className="text-lg text-muted-foreground">
            Compre itens com as marcas do Grupo RHenz
          </h2>
          <h4 className="text-sm text-muted-foreground">*Possibilidade de compra de brinde de ambas empresas, mas em pedidos <strong> distintos.</strong></h4>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="flex overflow-x-auto justify-center sm:justify-start">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Produtos
            </TabsTrigger>

            <TabsTrigger value="cart" className="flex items-center gap-2">
              <ShoppingCartIcon className="h-4 w-4" />
              Carrinho
              {cartItemCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {cartItemCount}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Meus Pedidos
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="mb-4 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-64">
                <Select
                  value={enterprise}
                  onValueChange={(v) => setEnterprise(v as typeof enterprise)}
                  disabled={!!cartEnterprise}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={cartEnterprise ? `Produtos de ${cartEnterprise}` : "Filtrar por empresa"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as empresas</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="RHenz">RHenz</SelectItem>
                    <SelectItem value="Cristallux">Cristallux</SelectItem>
                  </SelectContent>
                </Select>
                {cartEnterprise && (
                  <p className="text-sm text-muted-foreground">
                    Filtro automático: mostrando apenas produtos de {cartEnterprise}
                  </p>
                )}
              </div>
            </div>
            <ProductGrid size="sm" enterpriseFilter={enterprise} />
          </TabsContent>

          <TabsContent value="cart" className="flex justify-center">
            <div className="w-full max-w-lg">
              <ShoppingCart />
            </div>
          </TabsContent>

          <TabsContent value="orders" className="overflow-y-auto max-h-[calc(100vh-200px)] p-2 md:p-0">
            {/* Filtro de pedidos */}
            <div className="mb-4 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-64">
                <Select value={orderFilter} onValueChange={(v) => setOrderFilter(v as typeof orderFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="SOLICITADO">Solicitado</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <MyOrdersList filter={orderFilter} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}

export default function ShopPage() {
  return (
    <CartProvider>
      <ShopPageContent />
    </CartProvider>
  )
}