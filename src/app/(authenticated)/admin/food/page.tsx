"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccessControl } from "@/hooks/use-access-control"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import OrdersTab from "./_components/orders-tab"
import RestaurantsTab from "./_components/restaurants-tab"
import MenuTab from "./_components/menu-tab"
import MetricsTab from "./_components/metrics-tab"
import DREReport from "./_components/dre-report"
 

// Componente principal da página de administração de comida
export default function AdminFoodPage() {
  // Hooks devem ser chamados no topo, antes de qualquer lógica condicional
  const router = useRouter()
  const { hasAdminAccess, isLoading, canViewDREReport } = useAccessControl()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, delivered: 0 })
  
  // Verificar acesso ao módulo de comida
  if (!isLoading && !hasAdminAccess("/admin/food")) {
    router.replace("/")
    return null
  }

  // Determinar se deve mostrar a aba DRE
  const showDRETab = !isLoading && canViewDREReport()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração - Pedidos de Comida</h1>
          <p className="text-muted-foreground">
            Gerencie restaurantes e acompanhe pedidos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total de Pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Entregues</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurantes</TabsTrigger>
          <TabsTrigger value="menu">Cardápios</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          {showDRETab && (
            <TabsTrigger value="dre">Relatório DRE</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <OrdersTab
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedRestaurant={selectedRestaurant}
            setSelectedRestaurant={setSelectedRestaurant}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            userName={userName}
            setUserName={setUserName}
            onStatsChange={setStats}
          />
        </TabsContent>

                  <TabsContent value="restaurants" className="space-y-4">
          <RestaurantsTab />
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
          <MenuTab />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
          <MetricsTab
            selectedYear={selectedDate.getFullYear()}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
          </TabsContent>

          {showDRETab && (
            <TabsContent value="dre" className="space-y-4">
              <DREReport
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </TabsContent>
          )}
      </Tabs>
    </div>
  )
} 