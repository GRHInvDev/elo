"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Minus, ShoppingCart } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import type { Product } from "@prisma/client"

interface CreateOrderModalProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateOrderModal({ product, open, onOpenChange, onSuccess }: CreateOrderModalProps) {
  const [quantity, setQuantity] = useState(1)
  const utils = api.useUtils()

  const createOrder = api.productOrder.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido criado com sucesso!")
      setQuantity(1)
      onOpenChange(false)
      void utils.productOrder.listMyOrders.invalidate()
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(`Erro ao criar pedido: ${error.message}`)
    },
  })

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 1 && value <= product.stock) {
      setQuantity(value)
    } else if (e.target.value === "") {
      setQuantity(1)
    }
  }

  const handleSubmit = () => {
    if (quantity < 1 || quantity > product.stock) {
      toast.error("Quantidade inválida")
      return
    }

    createOrder.mutate({
      productId: product.id,
      quantity,
    })
  }

  const totalPrice = product.price * quantity
  const isOutOfStock = product.stock <= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Pedido</DialogTitle>
          <DialogDescription>
            Confirme os detalhes do seu pedido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Imagem e informações do produto */}
          <div className="flex gap-4">
            {product.imageUrl && product.imageUrl.length > 0 && (
              <div className="relative h-24 w-24 rounded-md overflow-hidden border flex-shrink-0">
                <Image
                  src={product.imageUrl[0] ?? "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            )}

            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              <Badge variant="outline">{product.enterprise}</Badge>
            </div>
          </div>

          {/* Preço unitário */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Preço unitário:</span>
            <span className="font-semibold">R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={quantity <= 1 || isOutOfStock}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={isOutOfStock}
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                disabled={quantity >= product.stock || isOutOfStock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isOutOfStock 
                ? "Produto indisponível" 
                : `Estoque disponível: ${product.stock} unidade${product.stock !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Preço total */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
            <span className="font-semibold text-lg">Total:</span>
            <span className="font-bold text-xl text-primary">
              R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={createOrder.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isOutOfStock || createOrder.isPending}
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Criar Pedido
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

