"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ClipboardEdit } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface StatusUpdateButtonProps {
  responseId: string
  currentStatus: string
  currentComment: string
}

export function StatusUpdateButton({ responseId, currentStatus, currentComment }: StatusUpdateButtonProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [comment, setComment] = useState(currentComment)
  const router = useRouter()

  const updateStatus = api.formResponse.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso")
      router.refresh()
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`)
    },
  })

  const handleUpdate = () => {
    updateStatus.mutate({
      responseId,
      status: status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
      statusComment: comment,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <ClipboardEdit className="h-4 w-4 mr-1" />
          Atualizar Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar Status da Resposta</DialogTitle>
          <DialogDescription>Atualize o status e adicione comentários sobre esta resposta.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_STARTED">Não iniciado</SelectItem>
                <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                <SelectItem value="COMPLETED">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adicione um comentário sobre o status"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={updateStatus.isPending}>
            {updateStatus.isPending ? "Atualizando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

