"use client"

import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { api } from "@/trpc/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Loader2, LucideEllipsis, LucidePencil, LucideTrash2 } from "lucide-react"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"

export function FlyersList() {
  const { data: flyers, isLoading } = api.flyer.list.useQuery()
  const auth = useAuth();

  const deleteFlyer = api.flyer.delete.useMutation({
    onSuccess: () => utils.flyer.list.invalidate()
  });

  const utils = api.useUtils();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-video w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!flyers?.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">Nenhum encarte encontrado</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">Não há encartes publicados no momento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {flyers.map((flyer) => (
        <Card key={flyer.id}>
          <CardHeader className="flex flex-row justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">{flyer.title}</h3>
              <p className="text-sm text-muted-foreground">
                Publicado em {format(flyer.createdAt, "PP", { locale: ptBR })}
              </p>
            </div>
            <div>
              {auth.userId === flyer.authorId && (
                <div>
                  <Popover>
                    <PopoverTrigger>
                      <Button size="icon" variant="ghost">
                        <LucideEllipsis className="size-3" /> 
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 flex flex-col p-1">
                      <UpdateFlyerDialog {...flyer} />
                      <Button size="sm" disabled={deleteFlyer.isPending} className="text-red-500 hover:text-red-800" variant="ghost" onClick={()=>{deleteFlyer.mutate({id: flyer.id}) }}>
                        {
                        deleteFlyer.isPending ? 
                          <Loader2 className="size-4 animate-spin" />
                            :
                          <LucideTrash2 className="size-4"/>
                        }
                        Excluir
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video overflow-hidden rounded-md">
              <Image src={flyer.imageUrl || "/placeholder.svg"} alt={flyer.title} fill className="object-cover" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{flyer.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface UpdateFlyerDialogProps {
  id: string,
  title: string,
  description: string,
  imageUrl: string
} 


function UpdateFlyerDialog({
  id,
  title,
  description,
  imageUrl
}:UpdateFlyerDialogProps){
  const utils = api.useUtils();
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const updateFlyer = api.flyer.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Encarte alterado",
        description: "Seu encarte foi alterado com sucesso.",
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

    updateFlyer.mutate({
      id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      imageUrl: formData.get("imageUrl") as string,
      published: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <LucidePencil className="h-4 w-4" />
          Editar Encarte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Encarte</DialogTitle>
            <DialogDescription>Compartilhe uma promoção com a equipe</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" defaultValue={title} placeholder="Digite o título do encarte" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Descrição</Label>
              <Textarea id="content" name="description" defaultValue={description} placeholder="Digite a descrição do encarte." required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">imagem</Label>
              <Input id="image" name="imageUrl" defaultValue={imageUrl} placeholder="https://linkparaaimagem.com/encarte.png" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateFlyer.isPending}>
              {updateFlyer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}