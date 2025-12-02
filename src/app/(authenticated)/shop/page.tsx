"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import ProductGrid from "@/components/shop/product-grid"
import { MyOrdersList } from "@/components/shop/my-orders-list"
import ShoppingCart from "@/components/shop/shopping-cart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingBag, ShoppingCart as ShoppingCartIcon, Inbox, FileDown } from "lucide-react"
import { api } from "@/trpc/react"
import type { RouterOutputs } from "@/trpc/react"
import React, { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CartProvider } from "@/contexts/cart-context"
import { useCart } from "@/hooks/use-cart"
import { useAccessControl } from "@/hooks/use-access-control"
import { OrdersKanban } from "@/components/admin/products/orders-kanban"

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
    refetchOnWindowFocus: true,
  })
  const myOrders = ordersQuery.data
  const { enterprise: cartEnterprise, totalItems } = useCart()
  const { canViewAnswerWithoutAdminAccess, canManageProducts, isSudo } = useAccessControl()

  // Verificar se o usuário pode ver a aba de pedidos recebidos
  const canViewReceivedOrders = canViewAnswerWithoutAdminAccess() || canManageProducts() || isSudo

  // Contar pedidos não lidos (apenas para usuários com permissão)
  const { data: unreadReceivedCount = 0 } = api.productOrder.countUnread.useQuery(undefined, {
    enabled: canViewReceivedOrders,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  })

  // Se há itens no carrinho, filtrar apenas produtos da mesma empresa
  const [enterprise, setEnterprise] = useState<"ALL" | "Box" | "RHenz" | "Cristallux" | "Box_Filial" | "Cristallux_Filial">("ALL");
  const [orderFilter, setOrderFilter] = useState<"ALL" | "SOLICITADO" | "EM_ANDAMENTO">("ALL");
  const [nameFilter, setNameFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<"ALL" | "0-50" | "50-100" | "100-200" | "200+">("ALL");

  const unreadCount = getUnreadCount(myOrders)
  const cartItemCount = totalItems ?? 0

  // Atualizar filtro quando empresa do carrinho muda
  React.useEffect(() => {
    if (cartEnterprise) {
      setEnterprise(cartEnterprise as typeof enterprise)
    }
  }, [cartEnterprise])

  const handleExportPDF = () => {
    window.print()
  }

  return (
    <DashboardShell className="print:p-4">
      <div className="space-y-6 w-full max-w-full overflow-x-hidden">
        <div className="print:hidden">
          <h1 className="text-3xl font-bold">
            Lojinha RHenz
          </h1>
          <h2 className="text-lg text-muted-foreground">
            Compre itens com as marcas do Grupo RHenz
          </h2>
          <h4 className="text-sm text-muted-foreground break-words">*Possibilidade de compra de brinde de ambas empresas, mas em pedidos <strong> distintos.</strong></h4>
        </div>

        {/* Título para impressão */}
        <div className="hidden print:block print:mb-4">
          <h1 className="text-2xl font-bold">Catálogo de Produtos - Lojinha RHenz</h1>
        </div>

        <Tabs defaultValue="products" className="space-y-4 w-full max-w-full">
          <TabsList className="flex overflow-x-auto justify-center sm:justify-start w-full max-w-full print:hidden">
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
            {canViewReceivedOrders && (
              <TabsTrigger value="received-orders" className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Pedidos Recebidos
                {unreadReceivedCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {unreadReceivedCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="products" className="w-full max-w-full overflow-x-hidden">
            <div className="mb-4 space-y-3 w-full max-w-full print:hidden">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-full">
                <div className="w-full sm:w-64 max-w-full">
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
                    <p className="text-sm text-muted-foreground break-words mt-1">
                      Filtro automático: mostrando apenas produtos de {cartEnterprise}
                    </p>
                  )}
                </div>
                <div className="w-full sm:w-64 max-w-full">
                  <Label htmlFor="name-filter" className="sr-only">Filtrar por nome</Label>
                  <Input
                    id="name-filter"
                    type="text"
                    placeholder="Buscar por nome..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full sm:w-64 max-w-full">
                  <Select
                    value={priceFilter}
                    onValueChange={(v) => setPriceFilter(v as typeof priceFilter)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por preço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos os preços</SelectItem>
                      <SelectItem value="0-50">Até R$ 50,00</SelectItem>
                      <SelectItem value="50-100">R$ 50,00 - R$ 100,00</SelectItem>
                      <SelectItem value="100-200">R$ 100,00 - R$ 200,00</SelectItem>
                      <SelectItem value="200+">Acima de R$ 200,00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleExportPDF} variant="outline" className="print:hidden">
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </div>
            <ProductGrid 
              size="sm" 
              enterpriseFilter={enterprise}
              nameFilter={nameFilter}
              priceFilter={priceFilter}
            />
          </TabsContent>

          <TabsContent value="cart" className="flex justify-center w-full max-w-full overflow-x-hidden">
            <div className="w-full max-w-lg px-2">
              <ShoppingCart />
            </div>
          </TabsContent>

          <TabsContent value="orders" className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-200px)] p-2 md:p-0 w-full max-w-full">
            {/* Filtro de pedidos */}
            <div className="mb-4 flex flex-col sm:flex-row items-center gap-3 w-full max-w-full">
              <div className="w-full sm:w-64 max-w-full">
                <Select value={orderFilter} onValueChange={(v) => setOrderFilter(v as typeof orderFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="SOLICITADO">Solicitado</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <MyOrdersList filter={orderFilter} />
          </TabsContent>

          {canViewReceivedOrders && (
            <TabsContent value="received-orders" className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-200px)] p-2 md:p-0 w-full max-w-full">
              <OrdersKanban />
            </TabsContent>
          )}
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