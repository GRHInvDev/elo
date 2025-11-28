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
import { Loader2, ShoppingCart } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import type { Product } from "@prisma/client"
import type { CartItem } from "@/types/cart"

interface CreateOrderModalProps {
  product?: Product // Para compatibilidade com uso antigo
  cartItems?: CartItem[] // Para uso com carrinho
  enterprise?: Product["enterprise"] | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateOrderModal({ product, cartItems, enterprise, open, onOpenChange, onSuccess }: CreateOrderModalProps) {
  // Se cartItems foi passado, estamos usando o carrinho
  const isCartMode = !!cartItems && cartItems.length > 0
  const items = isCartMode ? cartItems : (product ? [{ product, quantity: 1 }] : [])

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
      setPaymentMethod("")
      setLastSubmittedWhatsapp(whatsapp.replace(/\D/g, "") || null)
      setWhatsapp("")
      onOpenChange(false)
      setShowSuccessModal(true)
      void utils.productOrder.listMyOrders.invalidate()
      void utils.productOrder.listMyPendingGroups.invalidate()
      void utils.product.getAll.invalidate()
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(`Erro ao criar pedido: ${error.message}`)
    },
  })

  const createMultipleOrders = api.productOrder.createMultiple.useMutation({
    onSuccess: () => {
      setPaymentMethod("")
      setLastSubmittedWhatsapp(whatsapp.replace(/\D/g, "") ?? null)
      setWhatsapp("")
      onOpenChange(false)
      setShowSuccessModal(true)
      void utils.productOrder.listMyOrders.invalidate()
      void utils.productOrder.listMyPendingGroups.invalidate()
      void utils.product.getAll.invalidate()
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(`Erro ao criar pedidos: ${error.message}`)
    },
  })

  // Verificar se existe pedido pendente de outra empresa
  const targetEnterprise = isCartMode ? enterprise : (product?.enterprise ?? null)
  const hasPendingOrderFromOtherEnterprise = targetEnterprise ? (pendingGroups?.some(group =>
    group.enterprise !== targetEnterprise
  ) ?? false) : false

  const otherEnterpriseName = targetEnterprise ? pendingGroups?.find(group =>
    group.enterprise !== targetEnterprise
  )?.enterprise : undefined

  const handleSubmit = () => {
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
      toast.error(`Você já possui um pedido pendente da empresa ${otherEnterpriseName}. Finalize ou cancele esse pedido antes de fazer um pedido da empresa ${targetEnterprise}.`)
      return
    }

    if (isCartMode && cartItems) {
      // Modo carrinho - criar múltiplos pedidos
      createMultipleOrders.mutate({
        orders: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        paymentMethod,
        contactWhatsapp: whatsappDigits,
      })
    } else if (product) {
      // Modo produto único - criar um pedido
      createOrder.mutate({
        productId: product.id,
        quantity: 1,
        paymentMethod,
        contactWhatsapp: whatsappDigits ?? undefined,
      })
    }
  }

  const totalPrice = items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  const isOutOfStock = items.some(item => item.product.stock < item.quantity)

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
          {/* Produtos no carrinho */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-4 p-3 border rounded-lg">
                {item.product.imageUrl && item.product.imageUrl.length > 0 && (
                  <div className="relative h-16 w-16 rounded-md overflow-hidden border flex-shrink-0">
                    <Image
                      src={item.product.imageUrl[0] ?? "/placeholder.svg"}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">{item.product.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{item.product.enterprise}</Badge>
                    <span className="text-sm font-medium">{item.quantity}x</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Preço unitário:</span>
                    <span>R$ {item.product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>Subtotal:</span>
                    <span>R$ {(item.product.price * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ))}
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
                <SelectValue placeholder={totalPrice >= 100 ? "Selecione a forma de pagamento" : "PIX"} />
              </SelectTrigger>
              <SelectContent>
                {totalPrice >= 100 && (
                  <SelectItem value="BOLETO">Boleto - 28 dias</SelectItem>
                )}
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
                Finalize ou cancele esse pedido antes de fazer um pedido da empresa {targetEnterprise}.
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
              disabled={
                isOutOfStock ||
                createOrder.isPending ||
                createMultipleOrders.isPending ||
                hasPendingOrderFromOtherEnterprise ||
                !paymentMethod ||
                !whatsapp.replace(/\D/g, "") ||
                whatsapp.replace(/\D/g, "").length < 10
              }
            >
              {(createOrder.isPending || createMultipleOrders.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Criar Pedido{isCartMode ? ` (${items.length} ${items.length === 1 ? 'item' : 'itens'})` : ''}
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
              {targetEnterprise === "Cristallux" ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    Seu pedido estará disponível para retirada no setor de Marketing da Cristallux em Santa Cruz do Sul, em 24 horas após a confirmação.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Exemplo:</strong> Pedido confirmado às 14h → retirada liberada após as 14h do próximo dia útil.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Colegas de outras unidades receberão contato da equipe interna para agendar retirada ou envio, com possibilidade de custo de frete por conta do Destinatário (a ser previamente combinado).
                  </p>
                </>
              ) : targetEnterprise === "Box" ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    Seu pedido estará disponível para retirada na Expedição em Santa Cruz do Sul em 24 horas após a confirmação.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Exemplo:</strong> Pedido confirmado às 14h → retirada liberada após as 14h do próximo dia útil.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Colegas de outras unidades receberão contato da equipe interna para agendar retirada ou envio, com possibilidade de custo de frete por conta do Destinatário (a ser previamente combinado).
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    Seu pedido estará disponível para retirada na Expedição em Santa Cruz do Sul em 24 horas após a confirmação.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Exemplo:</strong> Pedido confirmado às 14h → retirada liberada após as 14h do próximo dia útil.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Equipe de outras unidades receberão contato da equipe interna para agendar retirada ou envio.
                  </p>
                </>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Dúvidas?</strong> Use o chat na opção Lojinha / Meus Pedidos.
              </p>
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

