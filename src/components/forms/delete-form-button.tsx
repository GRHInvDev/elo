"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DeleteFormButtonProps {
  formId: string
  formTitle: string
}

export function DeleteFormButton({ formId, formTitle }: DeleteFormButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const deleteForm = api.form.delete.useMutation({
    onSuccess: () => {
      toast.success("Formulário excluído com sucesso")
      router.refresh()
      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Erro ao excluir formulário: ${error.message}`)
    },
  })

  const handleDelete = () => {
    deleteForm.mutate({ id: formId })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir formulário</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o formulário &quot;{formTitle}&quot;? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteForm.isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

