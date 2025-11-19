"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import ProductGrid from "@/components/shop/product-grid"
import { MyOrdersList } from "@/components/shop/my-orders-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingBag } from "lucide-react"
import { api } from "@/trpc/react"
import type { RouterOutputs } from "@/trpc/react"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [enterprise, setEnterprise] = useState<"ALL" | "Box" | "RHenz" | "Cristallux" | "Box_Filial" | "Cristallux_Filial">("ALL");
  const [orderFilter, setOrderFilter] = useState<"ALL" | "SOLICITADO" | "EM_ANDAMENTO" | "CONCLUIDO">("ALL");

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
          <TabsList className="flex overflow-x-auto justify-center sm:justify-start">
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
            <div className="mb-4 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-64">
                <Select value={enterprise} onValueChange={(v) => setEnterprise(v as typeof enterprise)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as empresas</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="RHenz">RHenz</SelectItem>
                    <SelectItem value="Cristallux">Cristallux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ProductGrid size="sm" enterpriseFilter={enterprise} />
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