"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, X } from "lucide-react"

export interface DoubtsPopupProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function DoubtsPopup({
  isOpen,
  onClose,
  title = "Dúvidas",
  description = "Encontre respostas para suas dúvidas mais frequentes"
}: DoubtsPopupProps) {
  const [showIframe, setShowIframe] = useState(false)

  const handleOpenDoubts = () => {
    setShowIframe(true)
  }

  const handleCloseIframe = () => {
    setShowIframe(false)
  }

  return (
    <>
      {/* Card Popup Temporário */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              {title}
            </DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={handleOpenDoubts}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Central de Dúvidas
                </CardTitle>
                <CardDescription>
                  Acesse nossa base de conhecimento com respostas para dúvidas frequentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Abrir Central de Dúvidas
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal com Iframe */}
      <Dialog open={showIframe} onOpenChange={handleCloseIframe}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  Central de Dúvidas
                </DialogTitle>
                <DialogDescription>
                  Navegue pela nossa documentação e encontre respostas para suas dúvidas
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseIframe}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 h-full">
            <iframe
              src="/doubts"
              className="w-full h-full border-0"
              title="Central de Dúvidas"
              allow="fullscreen"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
