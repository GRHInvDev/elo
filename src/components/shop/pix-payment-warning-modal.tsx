"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface PixPaymentWarningModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose?: () => void
}

export function PixPaymentWarningModal({ open, onOpenChange, onClose }: PixPaymentWarningModalProps) {
  const handleClose = () => {
    onOpenChange(false)
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Informação sobre Pagamento via PIX
          </DialogTitle>
          <DialogDescription>
            Processo de pagamento e liberação do pedido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3 text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Para pagamentos via PIX, o setor Financeiro entrará em contato via WhatsApp.
                </p>
                <p className="text-amber-800 dark:text-amber-200">
                  Após a confirmação do pagamento, o pedido segue para a Logística e estará disponível para retirada dentro do prazo informado.
                </p>
              </div>
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

