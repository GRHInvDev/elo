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

/** Formata número para exibição no padrão do create-order-modal: (00) 00000-0000 ou (00) 0000-0000 */
function formatWhatsAppDisplay(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return value
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

  // Buscar dados de cadastro de compras do usuário do pedido
  const enterprise: Enterprise = order.product.enterprise ?? Enterprise.NA
  
  const userId: string = order.userId ?? ""
  const enabled: boolean = open && !!order && !!order.userId
  const { data: purchaseRegistration } = api.purchaseRegistration.getByUserIdAndEnterprise.useQuery(
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
          {/* Informações dos Produtos - Agrupados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                {(() => {
                  const groupOrders = order.orderGroup?.orders ?? (order as { _groupOrders?: typeof order[] })._groupOrders ?? []
                  const isGrouped = order.orderGroupId ?? groupOrders.length > 0
                  if (isGrouped && groupOrders.length > 0) {
                    return `Produtos (${groupOrders.length} ${groupOrders.length === 1 ? 'item' : 'itens'})`
                  }
                  return 'Produto'
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Se tem orderGroup ou _groupOrders, mostrar todos os produtos do grupo */}
              {(() => {
                const groupOrders = order.orderGroup?.orders ?? (order as { _groupOrders?: typeof order[] })._groupOrders ?? []
                const isGrouped = order.orderGroupId ?? groupOrders.length > 0
                
                if (isGrouped && groupOrders.length > 0) {
                  return groupOrders.map((groupOrder) => (
                    <div key={groupOrder.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                      {groupOrder.product.imageUrl && groupOrder.product.imageUrl.length > 0 && (
                        <div className="relative h-32 w-32 rounded-md overflow-hidden border flex-shrink-0">
                          <Image
                            src={groupOrder.product.imageUrl[0] ?? "/placeholder.svg"}
                            alt={groupOrder.product.name}
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="font-semibold text-lg">{groupOrder.product.name}</h3>
                          <p className="text-sm text-muted-foreground">{groupOrder.product.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{enterpriseLabels[groupOrder.product.enterprise] ?? groupOrder.product.enterprise}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Quantidade: <strong>{groupOrder.quantity}</strong>
                          </span>
                        </div>
                        <div className="text-lg font-semibold text-primary">
                          R$ {(groupOrder.product.price * groupOrder.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))
                }
                
                // Pedido único (sem grupo)
                return (
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
                )
              })()}
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
              {(() => {
                const groupOrders = order.orderGroup?.orders ?? (order as { _groupOrders?: typeof order[] })._groupOrders ?? []
                const isGrouped = order.orderGroupId ?? groupOrders.length > 0
                
                if (isGrouped && groupOrders.length > 0) {
                  return (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total do Pedido:</span>
                        <span className="text-sm font-semibold text-primary">
                          R$ {groupOrders.reduce((total, o) => total + (o.product.price * o.quantity), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )
                }
                return null
              })()}
              {order.orderTimestamp && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confirmado em:</span>
                    <span className="text-sm font-medium">
                      {format(
                        order.orderTimestamp instanceof Date
                          ? order.orderTimestamp
                          : new Date(order.orderTimestamp),
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
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium">
                    {order.user.firstName && order.user.lastName
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : (order.user as { lojinha_full_name?: string | null }).lojinha_full_name ?? order.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.user.email}</p>
                  {(order.contactWhatsapp ?? purchaseRegistration?.whatsapp) ? (
                    <p className="text-sm text-muted-foreground">
                      WhatsApp para contato:{" "}
                      <a
                        href={`https://wa.me/55${(order.contactWhatsapp ?? purchaseRegistration?.whatsapp ?? "").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        {formatWhatsAppDisplay(order.contactWhatsapp ?? purchaseRegistration?.whatsapp ?? "")}
                      </a>
                    </p>
                  ) : purchaseRegistration?.phone ? (
                    <p className="text-sm text-muted-foreground">
                      Telefone: {purchaseRegistration.phone}
                    </p>
                  ) : null}
                </div>
              </div>
              {/* Dados do pré-cadastro Lojinha (etapa primária) — visíveis para quem emite/visualiza o pedido */}
              {(() => {
                const u = order.user as {
                  lojinha_full_name?: string | null
                  lojinha_cpf?: string | null
                  lojinha_address?: string | null
                  lojinha_neighborhood?: string | null
                  lojinha_cep?: string | null
                  lojinha_rg?: string | null
                  lojinha_email?: string | null
                  lojinha_phone?: string | null
                }
                const hasLojinha = [
                  u.lojinha_full_name,
                  u.lojinha_cpf,
                  u.lojinha_address,
                  u.lojinha_neighborhood,
                  u.lojinha_cep,
                  u.lojinha_rg,
                  u.lojinha_email,
                  u.lojinha_phone,
                ].some(Boolean)
                if (!hasLojinha) return null
                return (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-2 mt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Dados do pré-cadastro (Lojinha)
                    </p>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {u.lojinha_full_name ? (
                        <>
                          <dt className="text-muted-foreground">Nome completo</dt>
                          <dd className="font-medium">{u.lojinha_full_name}</dd>
                        </>
                      ) : null}
                      {u.lojinha_cpf ? (
                        <>
                          <dt className="text-muted-foreground">CPF</dt>
                          <dd>{u.lojinha_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4")}</dd>
                        </>
                      ) : null}
                      {u.lojinha_rg ? (
                        <>
                          <dt className="text-muted-foreground">RG</dt>
                          <dd>{u.lojinha_rg}</dd>
                        </>
                      ) : null}
                      {u.lojinha_email ? (
                        <>
                          <dt className="text-muted-foreground">E-mail</dt>
                          <dd>{u.lojinha_email}</dd>
                        </>
                      ) : null}
                      {u.lojinha_phone ? (
                        <>
                          <dt className="text-muted-foreground">Telefone</dt>
                          <dd>{u.lojinha_phone}</dd>
                        </>
                      ) : null}
                      {u.lojinha_address ? (
                        <>
                          <dt className="text-muted-foreground sm:col-span-2">Endereço</dt>
                          <dd className="sm:col-span-2">
                            {[
                              u.lojinha_address,
                              u.lojinha_neighborhood,
                              u.lojinha_cep ? `CEP ${u.lojinha_cep}` : null,
                            ]
                              .filter(Boolean)
                              .join(" — ")}
                          </dd>
                        </>
                      ) : null}
                    </dl>
                  </div>
                )
              })()}
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

