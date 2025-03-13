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
import { useRef, useState } from "react"
import { Loader2, LucideEllipsis, LucidePencil, LucideTrash2 } from "lucide-react"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { UPLTButton } from "./ui/uplt-button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

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
          <CardHeader className="flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src={flyer.author.imageUrl ?? undefined} />
                    <AvatarFallback>{flyer.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="text-md">{flyer.author.firstName} {flyer.author.lastName}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {format(flyer.createdAt, "PP", { locale: ptBR })}
                </p>
              </div>
              <div>
                {auth.userId === flyer.authorId && (
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <LucideEllipsis className="size-3" /> 
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-36 flex flex-col p-1">
                        <UpdateFlyerDialog {...{...flyer, iframe: flyer.iframe ?? undefined}} />
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
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-xl">{flyer.title}</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="place-items-center mb-4">
              {
                flyer.iframe ? (
                  <Dialog>
                    <DialogTrigger asChild>
                    <Image  className="rounded-md cursor-pointer" src={flyer.imageUrl || "/placeholder.svg"} alt={flyer.title} width={300} height={300} />
                    </DialogTrigger>
                    <DialogContent className="block h-full w-screen pb-4 max-w-screen">
                      <DialogHeader className="max-h-44 mb-4 min-h-0">
                        <DialogTitle>{flyer.title}</DialogTitle>
                      </DialogHeader>
                      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                      <iframe src={flyer.iframe} className="w-full h-full"/>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Image  className="rounded-md" src={flyer.imageUrl || "/placeholder.svg"} alt={flyer.title} width={300} height={300} />
                )
              }
            </div>
            <p className="mt-2 text-sm text-muted-foreground overflow-ellipsis overflow-hidden">{flyer.description}</p>
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
  imageUrl: string,
  iframe?: string
} 


function UpdateFlyerDialog({
  id,
  title,
  description,
  imageUrl,
  iframe
}:UpdateFlyerDialogProps){
  const utils = api.useUtils();
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const sendRef = useRef<(() => Promise<void>) | undefined>()
  const [loading, setLoading] = useState(false)
  const [fileUrl, setFileUrl] = useState("");

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


  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      setLoading(true)
      const formData = new FormData(e.currentTarget)
      if(sendRef.current) await sendRef.current().then(async ()=>{
        await updateFlyer.mutateAsync({
          id,
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          iframe: formData.get("iframe") as string,
          imageUrl: fileUrl === "" ? imageUrl : fileUrl,
          published: true,
        })
      })
      
      setLoading(false)
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
              <Label htmlFor="iframe">Link do PDF</Label>
              <Input id="iframe" name="iframe" defaultValue={iframe} placeholder="Digite o valor src do iframe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Descrição</Label>
              <Textarea id="content" name="description" defaultValue={description} placeholder="Digite a descrição do encarte." required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">imagem</Label>
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
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateFlyer.isPending || loading}>
              {(updateFlyer.isPending || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}