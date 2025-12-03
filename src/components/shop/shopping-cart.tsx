"use client"

import { useState, memo, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Minus, Plus, Trash2, CreditCard, ShoppingCart as ShoppingCartIcon } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { CreateOrderModal } from "./create-order-modal"
import { OrderSuccessModal } from "./order-success-modal"
import { PixPaymentWarningModal } from "./pix-payment-warning-modal"
import type { Product } from "@prisma/client"
import { cn } from "@/lib/utils"

interface ShoppingCartProps {
  className?: string
}

const ShoppingCart = memo(function ShoppingCart({ className }: ShoppingCartProps) {
  const { items, enterprise, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart()
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showPixWarningModal, setShowPixWarningModal] = useState(false)
  const [successEnterprise, setSuccessEnterprise] = useState<Product["enterprise"] | null>(null)


  const handleClearCart = useCallback(() => {
    clearCart()
  }, [clearCart])

  const handleCheckout = useCallback(() => {
    setIsCheckoutOpen(true)
  }, [])

  const handleCheckoutClose = useCallback(() => {
    setIsCheckoutOpen(false)
  }, [])

  const handleOrderCreated = useCallback((orderEnterprise: Product["enterprise"] | null) => {
    // Quando o pedido é criado, mostrar o modal de sucesso
    setSuccessEnterprise(orderEnterprise)
    setShowSuccessModal(true)
  }, [])

  const handleCheckoutSuccess = useCallback(() => {
    clearCart()
    setIsCheckoutOpen(false)
  }, [clearCart])

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false)
    // Após fechar o modal de sucesso, mostrar o modal do PIX
    setShowPixWarningModal(true)
  }, [])

  const handlePixWarningModalClose = useCallback(() => {
    setShowPixWarningModal(false)
    // Após fechar o modal do PIX, limpar o carrinho e fechar o modal de checkout
    handleCheckoutSuccess()
  }, [handleCheckoutSuccess])

  if (totalItems === 0) {
    return (
      <Card className={cn("w-full max-w-full overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Carrinho</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full max-w-full">
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="break-words">Seu carrinho está vazio</p>
            <p className="text-sm mt-1 break-words">Adicione produtos para começar</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <>
      <Card className={cn("w-full max-w-full overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <CardTitle className="flex items-center gap-2 min-w-0 flex-1">
              <ShoppingCartIcon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Carrinho</span>
              {enterprise && <Badge variant="outline" className="flex-shrink-0">{enterprise}</Badge>}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 w-full max-w-full overflow-hidden">
          <ScrollArea className="max-h-96 w-full">
            <div className="space-y-3 p-4 w-full max-w-full">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 w-full max-w-full min-w-0">
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

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h4 className="font-medium text-sm line-clamp-2 break-words">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      R$ {item.product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="text-sm font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="p-4 space-y-4 w-full max-w-full">
            <div className="flex items-center justify-between text-lg font-semibold gap-2 min-w-0">
              <span className="flex-shrink-0">Total:</span>
              <span className="text-primary truncate">
                R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <Button
              onClick={handleCheckout}
              className="w-full max-w-full"
              size="lg"
            >
              <CreditCard className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Finalizar Pedido ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <CreateOrderModal
        cartItems={items}
        enterprise={enterprise}
        open={isCheckoutOpen}
        onOpenChange={handleCheckoutClose}
        onOrderCreated={handleOrderCreated}
      />

      <OrderSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        enterprise={successEnterprise}
        onClose={handleSuccessModalClose}
      />

      <PixPaymentWarningModal
        open={showPixWarningModal}
        onOpenChange={setShowPixWarningModal}
        onClose={handlePixWarningModalClose}
      />
    </>
  )
})

export default ShoppingCart
