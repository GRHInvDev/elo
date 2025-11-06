"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import ProductGrid from "@/components/shop/product-grid"
import { MyOrdersList } from "@/components/shop/my-orders-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingBag } from "lucide-react"
import { api } from "@/trpc/react"
import type { RouterOutputs } from "@/trpc/react"

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

function getUnreadCount(orders: unknown): number {
  if (!Array.isArray(orders)) return 0
  
  let count = 0
  for (const order of orders) {
    if (isMyOrder(order) && order.read === false) {
      count++
    }
  }
  return count
}

export default function ShopPage() {
  // Contar pedidos não lidos do usuário
  const ordersQuery = api.productOrder.listMyOrders.useQuery()
  const myOrders = ordersQuery.data

  const unreadCount = getUnreadCount(myOrders)

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            RHenz Shop
          </h1>
          <h2 className="text-lg text-muted-foreground">
            Compre itens com as marcas do Grupo RHenz 
          </h2>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Produtos
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
            <ProductGrid />
          </TabsContent>

          <TabsContent value="orders">
            <MyOrdersList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}