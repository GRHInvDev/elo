"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { AlertTriangle, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "../ui/badge"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from "../ui/label"

type PaymentMethod = "PIX" | "BOLETO";

export function CartDialog() {
  const [open, setOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX")
  const {
    items,
    removeItem,
    updateItemQuantity,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart()
  const { toast } = useToast()

  const mutation = api.order.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Pedido enviado!",
        description: "Seu pedido foi enviado para o comercial! Você receberá um email com os detalhes de cada pedido.",
      })
      clearCart()
      setOpen(false)
    },
    onError: (error) => {
      toast({
        title: "Erro ao realizar pedido",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const companies = useMemo(
    () => [...new Set(items.map((item) => item.enterprise))],
    [items]
  )

  const handleSubmit = () => {
    mutation.mutate({
      products: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      paymentMethod,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4" />
          <span className="sr-only">Abrir carrinho</span>
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full p-2"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Seu Carrinho</DialogTitle>
          <DialogDescription>
            Confira os itens antes de finalizar a compra.
          </DialogDescription>
        </DialogHeader>
        {items.length === 0 ? (
          <p>Seu carrinho está vazio.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {companies.length > 1 && (
              <Alert variant="default">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  Seu carrinho contém itens de diferentes empresas. Pedidos
                  separados serão criados para cada empresa.
                </AlertDescription>
              </Alert>
            )}
            <div className="max-h-[400px] overflow-y-auto pr-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-2">
                  <Image
                    src={item.imageUrl[0] ?? "/placeholder.svg"}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.enterprise}
                    </p>
                    <p className="text-sm font-semibold">
                      {item.price.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateItemQuantity(item.id, item.quantity - 1)
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateItemQuantity(item.id, item.quantity + 1)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <p className="text-lg font-bold">Total:</p>
              <p className="text-lg font-bold">
                {totalPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
            <div className="mt-4">
                <p className="mb-2 font-medium">Método de Pagamento</p>
                <RadioGroup value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value as PaymentMethod)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PIX" id="pix"/>
                        <Label htmlFor="pix">Pix</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="BOLETO" id="boleto"/>
                        <Label htmlFor="boleto">Boleto para 28 dias</Label>
                    </div>
                </RadioGroup>
            </div>
          </div>
        )}
        <DialogFooter>
          {items.length > 0 && (
            <Button
              type="button"
              className="w-full"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Finalizar Compra
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 