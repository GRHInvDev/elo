"use client"

import type React from "react"

import { useRef, useState } from "react"
import { FileImage, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { UPLTButton } from "./ui/uplt-button"

export function CreateFlyerButton() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const utils = api.useUtils()
  const fileUrlRef = useRef<HTMLInputElement>(null);
  const createFlyer = api.flyer.create.useMutation({
    onSuccess: async () => {
      toast({
        title: "Encarte criado",
        description: "O encarte foi criado com sucesso.",
      })
      setOpen(false)
      await utils.flyer.list.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    createFlyer.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      imageUrl: formData.get("imageUrl") as string,
      published: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileImage className="mr-2 h-4 w-4" />
          Criar Encarte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Novo Encarte</DialogTitle>
            <DialogDescription>Crie um novo encarte para a empresa</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" placeholder="Digite o título do encarte" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" placeholder="Digite a descrição do encarte" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Imagem</Label>
              <UPLTButton
                onClientUploadComplete={(res) => {
                  if (fileUrlRef.current){
                    fileUrlRef.current.defaultValue = res.at(0)?.ufsUrl ?? "";
                  }
                  toast({title: "Imagem carregada!", description: "Sua imagem foi carregada com sucesso!"});
                }}
                onUploadError={(error: Error) => {
                  // Do something with the error.
                  alert(`ERRO! ${error.message}`);
                }}
              />
              <Input id="imageUrl" ref={fileUrlRef} className="hidden" name="imageUrl" type="url" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createFlyer.isPending}>
              {createFlyer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Encarte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}