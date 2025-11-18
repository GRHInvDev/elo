"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Phone, Mail, MapPin, MessageCircle, Calendar, Package, CreditCard, Building2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ProductOrderWithRelations } from "./orders-kanban-column"
import { api } from "@/trpc/react"
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface OrderDetailsModalProps {
  order: ProductOrderWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  // Buscar dados de cadastro de compras do usuário do pedido
  const { data: purchaseRegistration, isLoading: isLoadingRegistration } = api.purchaseRegistration.getByUserIdAndEnterprise.useQuery(
    {
      userId: order?.userId ?? "",
      enterprise: (order?.product.enterprise ?? "NA") as any
    },
    {
      enabled: open && !!order && !!order.userId,
    }
  )

  if (!order) return null

  const paymentMethodLabels: Record<string, string> = {
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
                  {order.paymentMethod ? paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod : "Não informado"}
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
                      {format(new Date(order.orderTimestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados de Cadastro para Compras */}
          {isLoadingRegistration ? (
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Carregando dados de cadastro...</span>
                </div>
              </CardContent>
            </Card>
          ) : purchaseRegistration ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados de Cadastro para Compras
                </CardTitle>
                <CardDescription>
                  Informações fornecidas pelo cliente no cadastro de compras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{purchaseRegistration.fullName}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium">{purchaseRegistration.phone}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{purchaseRegistration.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Endereço</p>
                    <p className="font-medium">{purchaseRegistration.address}</p>
                  </div>
                </div>
                {purchaseRegistration.whatsapp && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">WhatsApp</p>
                        <p className="font-medium">{purchaseRegistration.whatsapp}</p>
                      </div>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Cadastrado em</p>
                    <p className="font-medium">
                      {format(new Date(purchaseRegistration.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground text-center">
                  Cliente não possui cadastro de compras registrado para esta empresa.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

