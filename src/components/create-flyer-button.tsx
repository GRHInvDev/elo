"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileImage, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [loading, setLoading] = useState(false)
  const [fileUrl, setFileUrl] = useState("");
  const { toast } = useToast()
  const utils = api.useUtils()
  const sendRef = useRef<(() => Promise<void>) | undefined>()

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    if(sendRef.current) await sendRef.current().then(async ()=>{
      await createFlyer.mutateAsync({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        iframe: formData.get("iframe") as string,
        imageUrl: fileUrl,
        published: true,
      })
    })
    
    setLoading(false)
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
          <DialogHeader className='flex justify-between flex-row'>
            <div>
              <DialogTitle>Novo Encarte</DialogTitle>
              <DialogDescription>Crie um novo encarte para a empresa</DialogDescription>
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" placeholder="Digite o título do encarte" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="iframe">Link do PDF</Label>
              <Input id="iframe" name="iframe" placeholder="Digite o valor src do iframe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" placeholder="Digite a descrição do encarte" required />
            </div>
          </div>
          <div className="grid gap-2 mb-4">
            <Label htmlFor="imageUrl">Imagem</Label>
            <UPLTButton
              sendRef={sendRef}
              onClientUploadComplete={(res) => {
                setFileUrl(res.at(0)?.ufsUrl ?? "")
                console.log(fileUrl)
                toast({title: "Imagem carregada!", description: "Sua imagem foi carregada com sucesso!"});
              }}
              onUploadError={(error: Error) => {
                // Do something with the error.
                alert(`ERRO! ${error.message}`);
              }}
            />
          </div>
          <Button type="submit" disabled={createFlyer.isPending || loading}>
            {(createFlyer.isPending || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Encarte
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}