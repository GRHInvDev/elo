"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HelpCircle, AlertTriangle, CheckCircle2, MapPin } from "lucide-react"

interface OrderDoubtsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDoubtsModal({ open, onOpenChange }: OrderDoubtsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5 text-primary" />
            Dúvidas sobre o pedido
          </DialogTitle>
          <DialogDescription>
            Procedimento para retirada de pedidos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seu pedido foi registrado */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">📢</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-base">Procedimento para Retirada</h3>
                <p className="text-sm text-muted-foreground">
                  Seu pedido foi registrado e o prazo para retirada é de <strong>24 horas</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Atenção PIX */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-base text-amber-700 dark:text-amber-400">
                  Atenção: Pagamentos via PIX
                </h3>
                <p className="text-sm text-muted-foreground">
                  Para pagamentos via PIX, o setor Financeiro entrará em contato via WhatsApp.
                </p>
                <p className="text-sm text-muted-foreground">
                  Após a confirmação do pagamento, o pedido segue para a Logística e estará disponível para retirada dentro do prazo informado.
                </p>
              </div>
            </div>
          </div>

          {/* Locais de retirada */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-base">Locais de Retirada</h3>
                <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Retiradas BOX:</p>
                    <p className="text-sm text-muted-foreground">na Expedição em SCS</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Retiradas Cristallux:</p>
                    <p className="text-sm text-muted-foreground">no setor de MKT em SCS</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Demais localidades:</p>
                    <p className="text-sm text-muted-foreground">a combinar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informação importante */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-base text-green-700 dark:text-green-400">
                  Informação Importante
                </h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Não será enviado aviso de liberação</strong> — considere o pedido pronto para retirada após o prazo, se confirmado o pagamento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

