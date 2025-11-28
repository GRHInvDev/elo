"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createRestaurantSchema, updateRestaurantSchema } from "@/schemas/restaurant.schema"
import type { z } from "zod"
import type { Restaurant } from "@prisma/client"

interface RestaurantFormProps {
  restaurant?: Restaurant
  onSuccess?: () => void
}

type FormData = z.infer<typeof createRestaurantSchema>

export default function RestaurantForm({ restaurant, onSuccess }: RestaurantFormProps) {
  const utils = api.useUtils()
  
  const schema = restaurant ? updateRestaurantSchema : createRestaurantSchema
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema as z.ZodType<FormData>),
    defaultValues: {
      name: restaurant?.name ?? "",
      description: restaurant?.description ?? "",
      city: restaurant?.city ?? "",
      address: restaurant?.address ?? "",
      phone: restaurant?.phone ?? "",
      email: restaurant?.email ?? "",
      active: restaurant?.active ?? true,
    },
  })

  const activeValue = watch("active")

  const createRestaurant = api.restaurant.create.useMutation({
    onSuccess: () => {
      toast.success("Restaurante criado com sucesso!")
      void utils.restaurant.list.invalidate()
      reset()
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(`Erro ao criar restaurante: ${error.message}`)
    },
  })

  const updateRestaurant = api.restaurant.update.useMutation({
    onSuccess: () => {
      toast.success("Restaurante atualizado com sucesso!")
      void utils.restaurant.list.invalidate()
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar restaurante: ${error.message}`)
    },
  })

  const onSubmit = async (data: FormData) => {
    if (restaurant) {
      await updateRestaurant.mutateAsync({
        id: restaurant.id,
        ...data,
      } as z.infer<typeof updateRestaurantSchema>)
    } else {
      await createRestaurant.mutateAsync(data)
    }
  }

  // Atualizar valores quando o restaurante mudar
  useEffect(() => {
    if (restaurant) {
      reset({
        name: restaurant.name,
        description: restaurant.description ?? "",
        city: restaurant.city,
        address: restaurant.address,
        phone: restaurant.phone,
        email: restaurant.email,
        active: restaurant.active,
      })
    }
  }, [restaurant, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-destructive text-sm">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...register("description")}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && (
          <p id="description-error" className="text-destructive text-sm">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            {...register("city")}
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? "city-error" : undefined}
          />
          {errors.city && (
            <p id="city-error" className="text-destructive text-sm">
              {errors.city.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            {...register("phone")}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="text-destructive text-sm">
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          {...register("address")}
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? "address-error" : undefined}
        />
        {errors.address && (
          <p id="address-error" className="text-destructive text-sm">
            {errors.address.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-destructive text-sm">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={activeValue}
          onCheckedChange={(checked) => setValue("active", checked)}
        />
        <Label htmlFor="active">Ativo</Label>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {restaurant ? "Atualizando..." : "Criando..."}
          </>
        ) : (
          `${restaurant ? "Atualizar" : "Criar"} Restaurante`
        )}
      </Button>
    </form>
  )
}
