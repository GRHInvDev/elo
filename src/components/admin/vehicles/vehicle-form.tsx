"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { UPLTButton } from "@/components/ui/uplt-button"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { createVehicleSchema } from "@/schemas/vehicle.schema"
import type { Vehicle } from "@prisma/client"

const enterpriseOptions = [
  { value: "NA", label: "N/A" },
  { value: "Box", label: "Box" },
  { value: "RHenz", label: "RHenz" },
  { value: "Cristallux", label: "Cristallux" },
  { value: "Box_Filial", label: "Box Filial" },
]

interface VehicleFormProps {
  vehicle?: Vehicle
  onSuccess: () => void
  onCancel: () => void
}



export function VehicleForm({ vehicle, onSuccess, onCancel }: VehicleFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof createVehicleSchema>>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: vehicle ? {
      model: vehicle.model,
      plate: vehicle.plate,
      imageUrl: vehicle.imageUrl || "",
      enterprise: vehicle.enterprise as "NA" | "Box" | "RHenz" | "Cristallux" | "Box_Filial",
      kilometers: Number(vehicle.kilometers),
      availble: vehicle.availble,
    } : {
      model: "",
      plate: "",
      imageUrl: "",
      enterprise: "NA" as const,
      kilometers: 0,
      availble: true,
    },
  })

  // Atualizar o campo imageUrl quando uma nova imagem for enviada
  useEffect(() => {
    if (uploadedImageUrl) {
      setValue("imageUrl", uploadedImageUrl)
    }
  }, [uploadedImageUrl, setValue])

  // Função para lidar com a URL da imagem gerada pelo upload
  const handleImageUrlGenerated = (url: string) => {
    setUploadedImageUrl(url)
    toast.success("Imagem enviada com sucesso!")
  }

  const createVehicle = api.vehicle.create.useMutation()
  const updateVehicle = api.vehicle.update.useMutation()

  const onSubmit = async (data: z.infer<typeof createVehicleSchema>) => {
    setIsLoading(true)
    try {
      if (vehicle) {
        await updateVehicle.mutateAsync({
          id: vehicle.id,
          data,
        })
        toast.success("Veículo atualizado com sucesso!")
      } else {
        await createVehicle.mutateAsync(data)
        toast.success("Veículo criado com sucesso!")
      }
      onSuccess()
    } catch (error) {
      toast.error("Erro ao salvar veículo: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    } finally {
      setIsLoading(false)
    }
  }

  const selectedEnterprise = watch("enterprise")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="model">Modelo *</Label>
          <Input
            id="model"
            {...register("model")}
            placeholder="Ex: Fiat Uno"
          />
          {errors.model && (
            <p className="text-sm text-destructive">{errors.model.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plate">Placa *</Label>
          <Input
            id="plate"
            {...register("plate")}
            placeholder="Ex: ABC-1234"
            className="uppercase"
            maxLength={7}
          />
          {errors.plate && (
            <p className="text-sm text-destructive">{errors.plate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Upload de Imagem do Veículo</Label>
          <UPLTButton
            onImageUrlGenerated={handleImageUrlGenerated}
            onUploadError={(error) => {
              console.error("Erro no upload:", error)
              toast.error("Erro ao fazer upload da imagem")
            }}
            onUploadBegin={(filename) => {
              toast.loading(`Enviando ${filename}...`)
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="enterprise">Empresa *</Label>
          <Select
            value={selectedEnterprise}
            onValueChange={(value) => setValue("enterprise", value as "NA" | "Box" | "RHenz" | "Cristallux" | "Box_Filial")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
              {enterpriseOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.enterprise && (
            <p className="text-sm text-destructive">{errors.enterprise.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kilometers">Kilometragem *</Label>
          <Input
            id="kilometers"
            type="number"
            {...register("kilometers", { valueAsNumber: true })}
            placeholder="0"
          />
          {errors.kilometers && (
            <p className="text-sm text-destructive">{errors.kilometers.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="availble"
          checked={watch("availble")}
          onCheckedChange={(checked) => setValue("availble", !!checked)}
        />
        <Label htmlFor="availble">Veículo disponível para reserva</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : vehicle ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}
