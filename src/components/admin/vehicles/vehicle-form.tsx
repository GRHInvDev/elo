"use client"

import { useState, useEffect, useMemo } from "react"
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

interface VehicleFormProps {
  vehicle?: Vehicle
  onSuccess: () => void
  onCancel: () => void
}



export function VehicleForm({ vehicle, onSuccess, onCancel }: VehicleFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("")
  // Estado local da empresa para a cascata empresa → filial (padrão novo).
  const [empresaId, setEmpresaId] = useState("")

  const { data: empresas = [] } = api.empresas.list.useQuery()
  const { data: filiaisData = [] } = api.filiais.list.useQuery()

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
      filialId: vehicle.filialId ?? "",
      kilometers: Number(vehicle.kilometers),
      availble: vehicle.availble,
    } : {
      model: "",
      plate: "",
      imageUrl: "",
      filialId: "",
      kilometers: 0,
      availble: true,
    },
  })

  const filialId = watch("filialId")

  // Empresa efetiva (fonte única da verdade): a escolha explícita do usuário tem
  // precedência; senão, deriva da filial salva/selecionada. Assim, ao editar um
  // veículo a empresa aparece preenchida assim que `filiaisData` carrega, sem
  // depender de efeitos que poderiam apagar a filial salva.
  const empresaFromFilial = filiaisData.find((f) => f.id === filialId)?.empresa.id ?? ""
  const effectiveEmpresaId = empresaId !== "" ? empresaId : empresaFromFilial

  // Filiais da empresa efetiva
  const filiais = useMemo(
    () => filiaisData.filter((f) => f.empresa.id === effectiveEmpresaId),
    [filiaisData, effectiveEmpresaId],
  )

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
          <Label htmlFor="empresa">Empresa *</Label>
          <Select
            value={effectiveEmpresaId}
            onValueChange={(value) => {
              setEmpresaId(value)
              setValue("filialId", "")
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filial">Filial *</Label>
          <Select
            value={filialId ?? ""}
            onValueChange={(value) => setValue("filialId", value, { shouldValidate: true })}
            disabled={!effectiveEmpresaId}
          >
            <SelectTrigger>
              <SelectValue placeholder={effectiveEmpresaId ? "Selecione a filial" : "Selecione a empresa primeiro"} />
            </SelectTrigger>
            <SelectContent>
              {filiais.map((filial) => (
                <SelectItem key={filial.id} value={filial.id}>
                  {filial.name} ({filial.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.filialId && (
            <p className="text-sm text-destructive">{errors.filialId.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
