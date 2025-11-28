"use client"

import { useState } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import RestaurantForm from "./restaurant-form"

export default function RestaurantsTab() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState<Record<string, boolean>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const utils = api.useUtils()
  
  // Buscar restaurantes
  const restaurants = api.restaurant.list.useQuery()

  // Mutation para deletar
  const deleteRestaurant = api.restaurant.delete.useMutation({
    onSuccess: () => {
      toast.success("Restaurante excluído com sucesso!")
      void utils.restaurant.list.invalidate()
      setDeletingId(null)
    },
    onError: (error) => {
      toast.error(`Erro ao excluir restaurante: ${error.message}`)
      setDeletingId(null)
    },
  })

  const handleDelete = async (restaurantId: string) => {
    setDeletingId(restaurantId)
    try {
      await deleteRestaurant.mutateAsync({ id: restaurantId })
    } catch {
      // Erro já tratado no onError
    }
  }

  const handleEditDialogOpen = (restaurantId: string, open: boolean) => {
    console.log("[RestaurantsTab] handleEditDialogOpen:", { restaurantId, open })
    setEditDialogOpen((prev) => {
      const newState = { ...prev, [restaurantId]: open }
      console.log("[RestaurantsTab] Estado do dialog atualizado:", newState)
      return newState
    })
  }

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
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
                <RestaurantForm onSuccess={() => setCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {restaurants.isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : restaurants.data && restaurants.data.length > 0 ? (
            <div className="space-y-4">
              {restaurants.data.map((restaurant) => (
                <Card key={restaurant.id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-2">
                          <p className="font-medium">{restaurant.name}</p>
                          <Badge variant="outline">{restaurant.city}</Badge>
                          <Badge variant={restaurant.active ? "default" : "secondary"}>
                            {restaurant.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        {restaurant.description && (
                          <p className="text-sm text-muted-foreground">
                            {restaurant.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm flex-wrap gap-2">
                          <span className="text-muted-foreground">
                            📍 {restaurant.address}
                          </span>
                          <span className="text-muted-foreground">
                            📞 {restaurant.phone}
                          </span>
                          <span className="text-muted-foreground">
                            ✉️ {restaurant.email}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {restaurant._count?.orders || 0} pedidos realizados
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("[RestaurantsTab] Botão editar clicado para restaurante:", restaurant.id, restaurant.name)
                            handleEditDialogOpen(restaurant.id, true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar restaurante</span>
                        </Button>
                        <Dialog
                          open={editDialogOpen[restaurant.id] ?? false}
                          onOpenChange={(open) => {
                            console.log("[RestaurantsTab] Dialog onOpenChange:", { restaurantId: restaurant.id, open, currentState: editDialogOpen[restaurant.id] })
                            handleEditDialogOpen(restaurant.id, open)
                          }}
                        >
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Restaurante</DialogTitle>
                              <DialogDescription>
                                Atualize as informações do restaurante
                              </DialogDescription>
                            </DialogHeader>
                            <RestaurantForm
                              restaurant={restaurant}
                              onSuccess={() => {
                                console.log("[RestaurantsTab] onSuccess callback chamado para restaurante:", restaurant.id)
                                handleEditDialogOpen(restaurant.id, false)
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              disabled={deletingId === restaurant.id}
                            >
                              {deletingId === restaurant.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              <span className="sr-only">Excluir restaurante</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o restaurante &quot;{restaurant.name}&quot;?
                                <br />
                                Esta ação não pode ser desfeita e todos os cardápios e pedidos relacionados serão afetados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(restaurant.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
