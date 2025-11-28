"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, MessageCircle, Calendar, Package } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { RouterOutputs } from "@/trpc/react"
import { api } from "@/trpc/react"
import Image from "next/image"
import { Enterprise } from "@prisma/client"
import type { PaymentMethod } from "@prisma/client"
import { OrderChat } from "@/components/shop/order-chat"

type ProductOrderWithRelations = RouterOutputs["productOrder"]["listKanban"][number]
type PurchaseRegistration = RouterOutputs["purchaseRegistration"]["getByUserIdAndEnterprise"]

function hasProductAndUser(order: unknown): order is ProductOrderWithRelations & { product: NonNullable<ProductOrderWithRelations["product"]>, user: NonNullable<ProductOrderWithRelations["user"]> } {
  if (!order || typeof order !== "object") return false
  const o = order as Record<string, unknown>
  return "product" in o && "user" in o && o.product !== null && o.user !== null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isPurchaseRegistration(value: unknown): value is PurchaseRegistration {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.fullName === "string" &&
    typeof v.phone === "string" &&
    typeof v.email === "string" &&
    typeof v.address === "string"
  )
}

interface OrderDetailsModalProps {
  order: ProductOrderWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  if (!order || !hasProductAndUser(order)) return null

  // Type assertion para incluir contactWhatsapp
  const orderWithWhatsapp = order as typeof order & { contactWhatsapp?: string | null }

  // Buscar dados de cadastro de compras do usuário do pedido
  const enterprise: Enterprise = order.product.enterprise ?? Enterprise.NA
  
  const userId: string = order.userId ?? ""
  const enabled: boolean = open && !!order && !!order.userId
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: purchaseRegistration,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isLoading: isLoadingRegistration,
  } = api.purchaseRegistration.getByUserIdAndEnterprise.useQuery(
    { userId, enterprise },
    { enabled }
  )

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    BOLETO: "Boleto",
    PIX: "PIX",
  }

  const enterpriseLabels: Record<string, string> = {
    NA: "N/A",
    Box: "Box",
    RHenz: "RHenz",
    Cristallux: "Cristallux",
    Box_Filial: "Box Filial",
    Cristallux_Filial: "Cristallux Filial",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido</DialogTitle>
          <DialogDescription>
            Informações completas do pedido e dados do cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Produto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {order.product.imageUrl && order.product.imageUrl.length > 0 && (
                  <div className="relative h-32 w-32 rounded-md overflow-hidden border flex-shrink-0">
                    <Image
                      src={order.product.imageUrl[0] ?? "/placeholder.svg"}
                      alt={order.product.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">{order.product.name}</h3>
                    <p className="text-sm text-muted-foreground">{order.product.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{enterpriseLabels[order.product.enterprise] ?? order.product.enterprise}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Quantidade: <strong>{order.quantity}</strong>
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-primary">
                    R$ {(order.product.price * order.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  variant="outline"
                  className={
                    order.status === "SOLICITADO"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }
                >
                  {order.status === "SOLICITADO" ? "Solicitado" : "Em Andamento"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Forma de Pagamento:</span>
                <span className="text-sm font-medium">
                  {order.paymentMethod && order.paymentMethod in paymentMethodLabels 
                    ? paymentMethodLabels[order.paymentMethod] 
                    : order.paymentMethod ?? "Não informado"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data do Pedido:</span>
                <span className="text-sm font-medium">
                  {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              {order.orderTimestamp && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confirmado em:</span>
                    <span className="text-sm font-medium">
                      {format(
                        order.orderTimestamp instanceof Date 
                          ? order.orderTimestamp 
                          : new Date(order.orderTimestamp as string | number),
                        "dd/MM/yyyy 'às' HH:mm", 
                        { locale: ptBR }
                      )}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {order.user.firstName && order.user.lastName
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : order.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.user.email}</p>
                  {orderWithWhatsapp.contactWhatsapp && (
                    <p className="text-sm text-muted-foreground">
                      WhatsApp: ({orderWithWhatsapp.contactWhatsapp.slice(0, 2)}) {orderWithWhatsapp.contactWhatsapp.slice(2, 7)}-{orderWithWhatsapp.contactWhatsapp.slice(7)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat com o cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat com o cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderChat orderId={order.id} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

