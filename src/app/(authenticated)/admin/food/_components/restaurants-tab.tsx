"use client"

import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Eye } from "lucide-react"
import RestaurantForm from "./restaurant-form"

export default function RestaurantsTab() {
  // Buscar restaurantes
  const restaurants = api.restaurant.list.useQuery()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Restaurantes Parceiros</CardTitle>
          <CardDescription>
            Gerencie os restaurantes parceiros e seus cardápios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Restaurante
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Restaurante</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do novo restaurante parceiro
                  </DialogDescription>
                </DialogHeader>
                <RestaurantForm />
              </DialogContent>
            </Dialog>
          </div>

          {restaurants.data && restaurants.data.length > 0 ? (
            <div className="space-y-4">
              {restaurants.data.map((restaurant) => (
                <Card key={restaurant.id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{restaurant.name}</p>
                          <Badge variant="outline">{restaurant.city}</Badge>
                          <Badge variant={restaurant.active ? "default" : "secondary"}>
                            {restaurant.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {restaurant.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span>{restaurant.address}</span>
                          <span>{restaurant.phone}</span>
                          <span>{restaurant.email}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {restaurant._count?.orders || 0} pedidos realizados
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Restaurante</DialogTitle>
                            </DialogHeader>
                            <RestaurantForm restaurant={restaurant} />
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum restaurante cadastrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
