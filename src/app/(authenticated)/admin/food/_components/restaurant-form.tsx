"use client"

import { useState } from "react"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { type Restaurant } from "@prisma/client"

interface RestaurantFormProps {
  restaurant?: Restaurant
}

export default function RestaurantForm({ restaurant }: RestaurantFormProps) {
  const [formData, setFormData] = useState({
    name: restaurant?.name ?? "",
    description: restaurant?.description ?? "",
    city: restaurant?.city ?? "",
    address: restaurant?.address ?? "",
    phone: restaurant?.phone ?? "",
    email: restaurant?.email ?? "",
    active: restaurant?.active ?? true,
  })

  const createRestaurant = api.restaurant.create.useMutation({
    onSuccess: () => {
      toast.success("Restaurante criado com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao criar restaurante: ${error.message}`)
    },
  })

  const updateRestaurant = api.restaurant.update.useMutation({
    onSuccess: () => {
      toast.success("Restaurante atualizado com sucesso!")
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar restaurante: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (restaurant) {
      updateRestaurant.mutate({
        id: restaurant.id,
        ...formData,
      })
    } else {
      createRestaurant.mutate(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <Label htmlFor="active">Ativo</Label>
      </div>

      <Button type="submit" className="w-full">
        {restaurant ? "Atualizar" : "Criar"} Restaurante
      </Button>
    </form>
  )
}
