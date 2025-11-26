"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const [paymentMethod, setPaymentMethod] = useState<"BOLETO" | "PIX" | "">("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [whatsapp, setWhatsapp] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastSubmittedWhatsapp, setLastSubmittedWhatsapp] = useState<string | null>(null)
  const utils = api.useUtils()

  // Buscar grupos de pedidos pendentes para validar regra de empresa
  const { data: pendingGroups } = api.productOrder.listMyPendingGroups.useQuery(undefined, {
    enabled: open
  })

  const createOrder = api.productOrder.create.useMutation({
    onSuccess: () => {
      setQuantity(1)
      setPaymentMethod("")
      setLastSubmittedWhatsapp(whatsapp.replace(/\D/g, "") || null)
      setWhatsapp("")
      onOpenChange(false)
      setShowSuccessModal(true)
      void utils.productOrder.listMyOrders.invalidate()
      void utils.productOrder.listMyPendingGroups.invalidate()
      void utils.product.getAll.invalidate() // Atualizar lista de produtos para refletir novo estoque
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(`Erro ao criar pedido: ${error.message}`)
    },
  })

  // Verificar se existe pedido pendente de outra empresa
  const hasPendingOrderFromOtherEnterprise = pendingGroups?.some(group => 
    group.enterprise !== product.enterprise
  ) ?? false

  const otherEnterpriseName = pendingGroups?.find(group => 
    group.enterprise !== product.enterprise
  )?.enterprise

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

    if (!paymentMethod) {
      toast.error("Selecione a forma de pagamento")
      return
    }

    const whatsappDigits = whatsapp.replace(/\D/g, "")
    if (!whatsappDigits || whatsappDigits.length < 10) {
      toast.error("Informe um WhatsApp válido (mínimo 10 dígitos)")
      return
    }

    // Validar regra de negócio: não pode pedir produtos de empresas diferentes
    if (hasPendingOrderFromOtherEnterprise) {
      toast.error(`Você já possui um pedido pendente da empresa ${otherEnterpriseName}. Finalize ou cancele esse pedido antes de fazer um pedido da empresa ${product.enterprise}.`)
      return
    }

    createOrder.mutate({
      productId: product.id,
      quantity,
      paymentMethod: paymentMethod,
      contactWhatsapp: whatsappDigits || undefined,
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
          </div>

          {/* Forma de pagamento */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">
              Forma de Pagamento <span className="text-destructive">*</span>
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as "BOLETO" | "PIX")}
              disabled={isOutOfStock}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOLETO">Boleto - 28 dias</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-whatsapp">
              WhatsApp para contato <span className="text-destructive">*</span>
            </Label>
            <Input
              id="order-whatsapp"
              type="tel"
              placeholder="(00) 00000-0000"
              maxLength={15}
              value={whatsapp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "")
                if (value.length <= 11) {
                  setWhatsapp(value)
                }
              }}
              disabled={isOutOfStock}
            />
            <p className="text-xs text-muted-foreground">
              Usaremos este número para falar sobre o pedido, caso necessário.
            </p>
          </div>

          {/* Preço total */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
            <span className="font-semibold text-lg">Total:</span>
            <span className="font-bold text-xl text-primary">
              R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Aviso sobre pedido de outra empresa */}
          {hasPendingOrderFromOtherEnterprise && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                Você já possui um pedido pendente da empresa {otherEnterpriseName}.
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                Finalize ou cancele esse pedido antes de fazer um pedido da empresa {product.enterprise}.
              </p>
            </div>
          )}

          {/* Aviso sobre contato do setor responsável */}
          <div className="p-2 bg-muted/50 rounded-lg border border-muted">
            <p className="text-xs text-muted-foreground italic">
            *Olá! Caso necessário, o setor responsável poderá entrar em contato para obter mais informações. <br /> 
            <strong>Para isso, mencione seu contato de WhatsApp acima! </strong>
            </p>
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
              disabled={isOutOfStock || createOrder.isPending || hasPendingOrderFromOtherEnterprise || !paymentMethod || !whatsapp.replace(/\D/g, "") || whatsapp.replace(/\D/g, "").length < 10}
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

      {/* Modal de sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600">Pedido Recebido com Sucesso!</DialogTitle>
            <DialogDescription>
              Seu pedido foi registrado e está sendo processado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2">Instruções para retirada:</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Seu pedido estará disponível para retirada na Expedição em Santa Cruz do Sul em 24 horas após a confirmação.
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Exemplo:</strong> Pedido confirmado às 14h → retirada liberada após as 14h do próximo dia útil.
              </p>
              <p className="text-sm text-muted-foreground">
                Equipe de outras unidades receberão contato da equipe interna para agendar retirada ou envio.
              </p>
              <p> Dúvidas? Use o chat na opção Shop → Meus Pedidos no <strong> Elo | Intranet. </strong></p>
            </div>
            <Button
              onClick={() => {
                setShowSuccessModal(false)
              }}
              className="w-full"
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </Dialog>
  )
}

