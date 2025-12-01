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
import type { Product } from "@prisma/client"

interface ShoppingCartProps {
  className?: string
}

const ShoppingCart = memo(function ShoppingCart({ className }: ShoppingCartProps) {
  const { items, enterprise, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart()
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
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
    // Após fechar o modal de sucesso, limpar o carrinho e fechar o modal de checkout
    handleCheckoutSuccess()
  }, [handleCheckoutSuccess])

  if (totalItems === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5" />
            Carrinho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Seu carrinho está vazio</p>
            <p className="text-sm mt-1">Adicione produtos para começar</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5" />
              Carrinho
              {enterprise && <Badge variant="outline">{enterprise}</Badge>}
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
        <CardContent className="p-0">
          <ScrollArea className="max-h-96">
            <div className="space-y-3 p-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
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

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground">
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

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-primary">
                R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <Button
              onClick={handleCheckout}
              className="w-full"
              size="lg"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Finalizar Pedido ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
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
    </>
  )
})

export default ShoppingCart
