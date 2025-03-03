"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, FileImage, Loader2, LucideLink, MessageSquarePlus } from "lucide-react"

import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export function ContentFeed({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const utils = api.useUtils()

  const { data: posts, isLoading: isLoadingPosts } = api.post.list.useQuery()
  const { data: events } = api.event.list.useQuery()
  const { data: flyers } = api.flyer.list.useQuery()

  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      toast({
        title: "Post criado",
        description: "Seu post foi publicado com sucesso.",
      })
      setOpen(false)
      await utils.post.list.invalidate()
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

    createPost.mutate({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      published: true,
    })
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Feed de Conteúdo</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Novo Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={onSubmit}>
                  <DialogHeader>
                    <DialogTitle>Novo Post</DialogTitle>
                    <DialogDescription>Compartilhe uma novidade com a equipe</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Título</Label>
                      <Input id="title" name="title" placeholder="Digite o título do post" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea id="content" name="content" placeholder="Digite o conteúdo do post" required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createPost.isPending}>
                      {createPost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Publicar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="posts">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="flyers">Encartes</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-4">
              {isLoadingPosts ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : !posts?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum post publicado ainda.</p>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                                  <AvatarImage src={post.author.imageUrl ?? undefined} />
                                  <AvatarFallback>{post.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <p className="text-md text-muted-foreground flex items-center">
                            {post.author.firstName}
                          </p>
                        </div>
                        <LucideLink className="-rotate-45 size-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">{format(post.createdAt, "PPp", { locale: ptBR })}</p>
                      <h3 className="font-medium">{post.title}</h3>
                      <p className="text-sm text-muted-foreground">{post.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="events" className="mt-4">
              {!events?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento agendado.</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-4">
                            <AvatarImage src={event.author.imageUrl ?? undefined} />
                            <AvatarFallback>{event.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-muted-foreground">{event.author.firstName}</p>
                      </div>
                      <h3 className="font-medium">{event.title}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-4 w-4" />
                        {format(event.startDate, "PPp", { locale: ptBR })}
                      </div>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="flyers" className="mt-4">
              {!flyers?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum encarte publicado.</p>
              ) : (
                <div className="space-y-4">
                  {flyers.map((flyer) => (
                    <div key={flyer.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-4">
                                <AvatarImage src={flyer.author.imageUrl ?? undefined} />
                                <AvatarFallback>{flyer.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-muted-foreground">{flyer.author.firstName}</p>
                        <p>
                          {format(flyer.createdAt, "PP", { locale: ptBR })}
                        </p>
                      </div>
                      <h3 className="font-medium">{flyer.title}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FileImage className="mr-1 h-4 w-4" />
                      </div>
                      <p className="text-sm text-muted-foreground">{flyer.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

