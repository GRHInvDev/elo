"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createProductSchema, updateProductSchema } from "@/schemas/product.schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultipleImageUpload } from "@/components/ui/multiple-image-upload"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Product } from "@prisma/client"

interface ProductFormProps {
  product?: Product
  onSuccess: () => void
  onCancel: () => void
}

type CreateProductData = z.infer<typeof createProductSchema>
type UpdateProductData = z.infer<typeof updateProductSchema>

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>(product?.imageUrl ?? [])

  const isEditMode = !!product

  // Usar tipos condicionais baseados no modo
  const formConfig = isEditMode
    ? {
        schema: updateProductSchema,
        defaultValues: {
          id: product.id,
          name: product.name,
          description: product.description,
          enterprise: product.enterprise,
          price: product.price,
          stock: product.stock,
        } as UpdateProductData,
      }
    : {
        schema: createProductSchema,
        defaultValues: {
          name: "",
          description: "",
          enterprise: "RHenz" as const,
          price: 0,
          stock: 0,
        } as CreateProductData,
      }

  const form = useForm<CreateProductData | UpdateProductData>({
    // Type assertion necessária devido à incompatibilidade entre schemas de criação e atualização
    resolver: zodResolver(formConfig.schema as z.ZodType<CreateProductData | UpdateProductData>),
    defaultValues: formConfig.defaultValues,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  const createProduct = api.product.create.useMutation()
  const updateProduct = api.product.update.useMutation()

  // Sincronizar imageUrls com o form
  useEffect(() => {
    setValue("imageUrl", imageUrls, { shouldValidate: true })
  }, [imageUrls, setValue])

  // Inicializar imageUrls quando produto for carregado
  useEffect(() => {
    if (product?.imageUrl) {
      setImageUrls(product.imageUrl)
    }
  }, [product])

  const onSubmit = async (data: CreateProductData | UpdateProductData) => {
    setIsLoading(true)
    try {
      if (product) {
        const updateData: UpdateProductData = {
          id: product.id,
          name: data.name,
          description: data.description,
          enterprise: data.enterprise,
          imageUrl: imageUrls.length > 0 ? imageUrls : undefined,
          price: data.price,
          stock: data.stock,
        }
        await updateProduct.mutateAsync(updateData)
        toast.success("Produto atualizado com sucesso!")
      } else {
        const createData: CreateProductData = {
          name: data.name as string,
          description: data.description as string,
          enterprise: data.enterprise as "Box" | "Cristallux" | "RHenz",
          imageUrl: imageUrls,
          price: data.price as number,
          stock: data.stock as number,
        }
        await createProduct.mutateAsync(createData)
        toast.success("Produto criado com sucesso!")
      }
      onSuccess()
    } catch (error) {
      toast.error(
        `Erro ao salvar produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const selectedEnterprise = watch("enterprise")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Produto *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ex: Camiseta Personalizada"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Descreva o produto..."
          rows={4}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="enterprise">Empresa *</Label>
          <Select
            value={selectedEnterprise || "RHenz"}
            onValueChange={(value: "Box" | "Cristallux" | "RHenz") => {
              setValue("enterprise", value, { shouldValidate: true })
            }}
          >
            <SelectTrigger id="enterprise" aria-invalid={!!errors.enterprise}>
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Box">Box</SelectItem>
              <SelectItem value="Cristallux">Cristallux</SelectItem>
              <SelectItem value="RHenz">RHenz</SelectItem>
            </SelectContent>
          </Select>
          {errors.enterprise && (
            <p className="text-sm text-destructive">{errors.enterprise.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            {...register("price", { valueAsNumber: true })}
            placeholder="0.00"
            aria-invalid={!!errors.price}
            aria-describedby={errors.price ? "price-error" : undefined}
          />
          {errors.price && (
            <p id="price-error" className="text-sm text-destructive">
              {errors.price.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Estoque *</Label>
          <Input
            id="stock"
            type="number"
            step="1"
            min="0"
            {...register("stock", { valueAsNumber: true })}
            placeholder="0"
            aria-invalid={!!errors.stock}
            aria-describedby={errors.stock ? "stock-error" : undefined}
          />
          {errors.stock && (
            <p id="stock-error" className="text-sm text-destructive">
              {errors.stock.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Imagens do Produto *</Label>
        <MultipleImageUpload
          onImagesChange={setImageUrls}
          maxImages={5}
          initialImages={product?.imageUrl || []}
        />
        {errors.imageUrl && (
          <p className="text-sm text-destructive">
            {errors.imageUrl.message || "Adicione pelo menos uma imagem"}
          </p>
        )}
        {imageUrls.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Adicione pelo menos uma imagem do produto
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || imageUrls.length === 0}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? "Atualizar" : "Criar"} Produto
        </Button>
      </div>
    </form>
  )
}

