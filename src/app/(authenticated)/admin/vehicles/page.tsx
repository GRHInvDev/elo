"use client"

import { useState } from "react"
import { Plus, Search, Edit, Trash2, BarChart3, Car, TrendingUp } from "lucide-react"
import Image from "next/image"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VehicleForm } from "@/components/admin/vehicles/vehicle-form"
import { VehicleMetrics } from "@/components/admin/vehicles/vehicle-metrics"
import { VehicleUsageHistory } from "@/components/admin/vehicles/vehicle-usage-history"
import { UserRanking } from "@/components/admin/vehicles/user-ranking"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import type { Vehicle } from "@prisma/client"

export default function VehiclesAdminClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  // Queries
  const { data: vehicles, isLoading, refetch } = api.vehicle.getAll.useQuery({
    limit: 100,
  })

  const deleteVehicle = api.vehicle.delete.useMutation({
    onSuccess: () => {
      toast.success("Veículo excluído com sucesso!")
      void refetch()
    },
    onError: (error) => {
      toast.error("Erro ao excluir veículo: " + error.message)
    }
  })

  const handleDelete = async (vehicleId: string) => {
    try {
      await deleteVehicle.mutateAsync({ id: vehicleId })
    } catch (error) {
      // Error handled in mutation
      void error
    }
  }

  const filteredVehicles = vehicles?.items?.filter(vehicle =>
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.enterprise.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? []

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administração de Veículos</h1>
          <p className="text-muted-foreground">
            Gerencie a frota de veículos da empresa
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Veículo</DialogTitle>
            </DialogHeader>
            <VehicleForm
              onSuccess={() => {
                setIsCreateDialogOpen(false)
                void refetch()
              } } onCancel={function (): void {
                throw new Error("Function not implemented.")
              } }            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="vehicles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Veículos
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ranking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Veículos</CardTitle>
              <CardDescription>
                {filteredVehicles.length} veículo{filteredVehicles.length !== 1 ? 's' : ''} encontrado{filteredVehicles.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por modelo, placa ou empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredVehicles.map((vehicle) => (
                  <Card key={vehicle.id}>
                    {/* Imagem na parte superior total */}
                    <div className="relative w-full h-64 overflow-hidden">
                      {vehicle.imageUrl && vehicle.imageUrl.trim() !== '' && !imageErrors.has(vehicle.id) ? (
                        <Image
                          src={vehicle.imageUrl}
                          alt={`Foto de ${vehicle.model}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={() => {
                            setImageErrors(prev => new Set(prev).add(vehicle.id))
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                          <Car className="h-12 w-12 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground mt-2">
                            {vehicle.imageUrl && vehicle.imageUrl.trim() !== '' ? 'Erro na foto' : 'Sem foto'}
                          </span>
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg truncate">{vehicle.model}</CardTitle>
                          <CardDescription className="truncate">{vehicle.plate}</CardDescription>
                        </div>
                        <Badge variant={vehicle.availble ? "default" : "secondary"}>
                          {vehicle.availble ? "Disponível" : "Indisponível"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Empresa:</span>
                          <span>{vehicle.enterprise}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quilometragem:</span>
                          <span>{Number(vehicle.kilometers).toLocaleString()} km</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Dialog open={isEditDialogOpen && selectedVehicle?.id === vehicle.id} onOpenChange={(open) => {
                          setIsEditDialogOpen(open)
                          if (!open) setSelectedVehicle(null)
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVehicle(vehicle)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Editar Veículo</DialogTitle>
                            </DialogHeader>
                            <VehicleForm
                              vehicle={vehicle}
                              onSuccess={() => {
                                setIsEditDialogOpen(false)
                                setSelectedVehicle(null)
                                void refetch()
                              }} onCancel={function (): void {
                                throw new Error("Function not implemented.")
                              } }

                            />
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o veículo {vehicle.model} ({vehicle.plate})?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(vehicle.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredVehicles.length === 0 && (
                <div className="text-center py-12">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Nenhum veículo encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Tente ajustar os filtros de busca." : "Comece criando o primeiro veículo."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <VehicleMetrics />
        </TabsContent>

        <TabsContent value="history">
          <VehicleUsageHistory />
        </TabsContent>

        <TabsContent value="ranking">
          <UserRanking />
        </TabsContent>
      </Tabs>
    </div>
  )
}
