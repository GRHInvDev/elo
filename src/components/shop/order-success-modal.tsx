"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import type { Product } from "@prisma/client"

interface OrderSuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enterprise: Product["enterprise"] | null
  onClose?: () => void
}

export function OrderSuccessModal({ open, onOpenChange, enterprise, onClose }: OrderSuccessModalProps) {
  const handleClose = () => {
    onOpenChange(false)
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-green-600 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Pedido Recebido com Sucesso!
          </DialogTitle>
          <DialogDescription>
            Seu pedido foi registrado e está sendo processado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-3 text-lg">Instruções para retirada</h3>
            
            {/* Aviso sobre pagamentos via PIX */}
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2 text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Para pagamentos via PIX, o setor Financeiro entrará em contato via WhatsApp.
                  </p>
                  <p className="text-amber-800 dark:text-amber-200">
                    Após a confirmação do pagamento, o pedido segue para a Logística e estará disponível para retirada dentro do prazo informado.
                  </p>
                </div>
              </div>
            </div>

            {enterprise === "Cristallux" || enterprise === "Cristallux_Filial" ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Seu pedido estará disponível para retirada no setor de Marketing da Cristallux em Santa Cruz do Sul, em 24 horas após a confirmação.
                </p>
                <p>
                  <strong>Exemplo:</strong> Pedido confirmado às 14h → retirada liberada após as 14h do próximo dia útil.
                </p>
                <p>
                  Colegas de outras unidades receberão contato da equipe interna para agendar retirada ou envio, com possibilidade de custo de frete por conta do Destinatário (a ser previamente combinado).
                </p>
              </div>
            ) : enterprise === "Box" || enterprise === "Box_Filial" ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Seu pedido estará disponível para retirada na Expedição em Santa Cruz do Sul em 24 horas após a confirmação.
                </p>
                <p>
                  <strong>Exemplo:</strong> Pedido confirmado às 14h → retirada liberada após as 14h do próximo dia útil.
                </p>
                <p>
                  Colegas de outras unidades receberão contato da equipe interna para agendar retirada ou envio, com possibilidade de custo de frete por conta do Destinatário (a ser previamente combinado).
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Seu pedido estará disponível para retirada em 24 horas após a confirmação.
                </p>
                <p>
                  <strong>Exemplo:</strong> Pedido confirmado às 14h → retirada liberada após as 14h do próximo dia útil.
                </p>
                <p>
                  Colegas de outras unidades receberão contato da equipe interna para agendar retirada ou envio, com possibilidade de custo de frete por conta do Destinatário (a ser previamente combinado).
                </p>
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong>Dúvidas?</strong> Use o chat na opção Shop / Meus Pedidos.
              </p>
            </div>
          </div>
          <Button
            onClick={handleClose}
            className="w-full"
            size="lg"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

