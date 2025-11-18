"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAccessControl } from "@/hooks/use-access-control"
import { api } from "@/trpc/react"
import { ProductForm } from "@/components/admin/products/product-form"
import { ProductListTable } from "@/components/admin/products/product-list-table"
import { OrdersKanban } from "@/components/admin/products/orders-kanban"
import { Plus, AlertTriangle, Loader2, ShoppingBag, Package, Users } from "lucide-react"
import type { Product } from "@prisma/client"
import { EnterpriseManagers } from "@/components/admin/products/enterprise-managers"
import { ShopNotificationSettings } from "@/components/admin/products/shop-notification-settings"

export default function AdminProductsPage() {
  const { hasAdminAccess, isLoading: isLoadingAccess, canManageProducts, isSudo } = useAccessControl()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)

  const {
    data: products,
    isLoading: isLoadingProducts,
    refetch,
  } = api.product.getAll.useQuery(undefined, {
    enabled: !isLoadingAccess && (hasAdminAccess("/admin/products") || isSudo || canManageProducts()),
  })

  // Contar pedidos não lidos
  const { data: unreadCount = 0 } = api.productOrder.countUnread.useQuery(undefined, {
    enabled: !isLoadingAccess && (hasAdminAccess("/admin/products") || isSudo || canManageProducts()),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  })

  // Verificar acesso
  if (isLoadingAccess) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verificando permissões...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  // Verificar acesso: precisa ter acesso ao admin/products OU ter permissão can_manage_produtos
  const hasAccess = hasAdminAccess("/admin/products") || isSudo || canManageProducts()

  if (!hasAccess) {
    return (
      <DashboardShell>
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar o gerenciamento de produtos.
              Entre em contato com um administrador para solicitar a permissão &quot;Gerenciar produtos da loja&quot;.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardShell>
    )
  }

  const handleNewProduct = () => {
    setEditingProduct(undefined)
    setShowForm(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingProduct(undefined)
    void refetch()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingProduct(undefined)
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Produtos</h1>
            <p className="text-muted-foreground">
              Crie, edite e gerencie os produtos da loja
            </p>
          </div>
          {!showForm && (
            <Button onClick={handleNewProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Pedidos
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="managers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Responsáveis
            </TabsTrigger>
          </TabsList>

          {/* Tab de Produtos */}
          <TabsContent value="products" className="space-y-4">
            {/* Formulário */}
            {showForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</CardTitle>
                  <CardDescription>
                    {editingProduct
                      ? "Atualize as informações do produto"
                      : "Preencha os dados para criar um novo produto"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductForm
                    product={editingProduct}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                  />
                </CardContent>
              </Card>
            )}

            {/* Listagem */}
            {!showForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Cadastrados</CardTitle>
                  <CardDescription>
                    {products?.length ?? 0} produto(s) cadastrado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProducts ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ProductListTable
                      products={products ?? []}
                      onEdit={handleEditProduct}
                      onRefresh={() => void refetch()}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab de Pedidos */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos de Produtos</CardTitle>
                <CardDescription>
                  Gerencie os pedidos feitos pelos usuários. Arraste os cards entre as colunas para atualizar o status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersKanban />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Responsáveis */}
          <TabsContent value="managers" className="space-y-4">
            <ShopNotificationSettings />
            <EnterpriseManagers />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}

