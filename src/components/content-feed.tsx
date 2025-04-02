"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Calendar,
  Loader2,
  LucideEllipsis,
  LucideLink,
  LucidePencil,
  LucideTrash2,
  LucideVerified,
  MessageSquarePlus,
  MessageSquare,
  Smile,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import dynamic from "next/dynamic"
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
import { useAuth } from "@clerk/nextjs"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import Image from "next/image"
import type { Theme, EmojiClickData } from "emoji-picker-react"
import { useTheme } from "next-themes"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { UPLTButton } from "./ui/uplt-button"

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react").then((mod) => mod.default), { ssr: false })

export function ContentFeed({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
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

  const handleImageUrlGenerated = (url: string) => {
    setFileUrl(url)
    toast({
      title: "Imagem carregada",
      description: "A imagem foi carregada com sucesso.",
    })
    setLoading(false)
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    createPost.mutate({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      published: true,
      imageUrl: fileUrl,
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
                      <Label>Imagem</Label>
                      <UPLTButton
                        onImageUrlGenerated={handleImageUrlGenerated}
                        onUploadBegin={()=>{
                          setLoading(true)
                          toast({
                            title: "Anexando imagem",
                            description: "Estamos anexando sua imagem.",
                          })
                        }}
                        onUploadError={(error: Error) => {
                          toast({
                            title: "Erro",
                            description: error.message,
                            variant: "destructive",
                          })
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea id="content" name="content" placeholder="Digite o conteúdo do post" required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createPost.isPending || loading}>
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
                    <PostItem key={post.id} post={post} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="events" className="mt-4">
              {!events?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento agendado.</p>
              ) : (
                <div className="space-y-4 border-b pb-4">
                  {events.map((event) => (
                    <div key={event.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={event.author.imageUrl ?? undefined} />
                          <AvatarFallback>{event.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="text-md text-foreground flex items-center">
                          {event.author.firstName}{" "}
                          {event.author.role == "ADMIN" ? (
                            <LucideVerified className={"ml-2 text-blue-500 size-5"} />
                          ) : (
                            <LucideLink className={"-rotate-45 ml-2 size-3 text-muted-foreground"} />
                          )}
                        </p>
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
                    <div key={flyer.id} className="space-y-2 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={flyer.author.imageUrl ?? undefined} />
                          <AvatarFallback>{flyer.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="text-md text-foreground flex items-center">
                          {flyer.author.firstName}{" "}
                          {flyer.author.role == "ADMIN" ? (
                            <LucideVerified className={"ml-2 text-blue-500 size-5"} />
                          ) : (
                            <LucideLink className={"-rotate-45 ml-2 size-3 text-muted-foreground"} />
                          )}
                        </p>
                      </div>
                      <p>{format(flyer.createdAt, "PP", { locale: ptBR })}</p>
                      <h3 className="font-medium">{flyer.title}</h3>
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        {flyer.iframe ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Image
                                className="rounded-md cursor-pointer hover:zoom-in-50"
                                src={flyer.imageUrl || "/placeholder.svg"}
                                alt={flyer.title}
                                width={300}
                                height={300}
                              />
                            </DialogTrigger>
                            <DialogContent className="block h-full w-screen pb-4 max-w-screen">
                              <DialogHeader className="max-h-44 mb-4 min-h-0">
                                <DialogTitle>{flyer.title}</DialogTitle>
                              </DialogHeader>
                              {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                              <iframe src={flyer.iframe} className="w-full h-full" />
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Image
                            className="rounded-md"
                            src={flyer.imageUrl || "/placeholder.svg"}
                            alt={flyer.title}
                            width={300}
                            height={300}
                          />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground overflow-hidden overflow-ellipsis">
                        {flyer.description}
                      </p>
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

interface PostItemProps {
  post: {
    id: string
    title: string
    content: string
    authorId: string
    imageUrl: string | null
    author: {
      firstName: string | null
      lastName: string | null
      imageUrl: string | null
      role?: string
      enterprise?: string
    }
    createdAt: Date
  }
}

function PostItem({ post }: PostItemProps) {
  const auth = useAuth()
  const utils = api.useUtils()
  const { toast } = useToast()
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [newComment, setNewComment] = useState("")
  const { theme } = useTheme()
  const { data: userMe } = api.user.me.useQuery()

  // Get reactions for this post
  const { data: reactions } = api.reaction.listByPost.useQuery({ postId: post.id })
  const { data: reactionCounts } = api.reaction.getReactionCounts.useQuery({ postId: post.id })
  const { data: userReaction } = api.reaction.getUserReaction.useQuery({ postId: post.id })

  // Get comments for this post
  const { data: comments } = api.comment.listByPost.useQuery({ postId: post.id })

  // Mutations
  const addReaction = api.reaction.addReaction.useMutation({
    onSuccess: async () => {
      await utils.reaction.listByPost.invalidate({ postId: post.id })
      await utils.reaction.getReactionCounts.invalidate({ postId: post.id })
      await utils.reaction.getUserReaction.invalidate({ postId: post.id })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const removeReaction = api.reaction.removeReaction.useMutation({
    onSuccess: async () => {
      await utils.reaction.listByPost.invalidate({ postId: post.id })
      await utils.reaction.getReactionCounts.invalidate({ postId: post.id })
      await utils.reaction.getUserReaction.invalidate({ postId: post.id })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const addComment = api.comment.addComment.useMutation({
    onSuccess: async () => {
      setNewComment("")
      await utils.comment.listByPost.invalidate({ postId: post.id })
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const deleteComment = api.comment.removeComment.useMutation({
    onSuccess: async () => {
      await utils.comment.listByPost.invalidate({ postId: post.id })
      toast({
        title: "Comentário removido",
        description: "Seu comentário foi removido com sucesso.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const deletePost = api.post.delete.useMutation({
    onSuccess: async () => {
      toast({
        title: "Post excluído",
        description: "Seu post foi excluído com sucesso.",
      })
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

  // Handle emoji selection
  const handleEmojiClick = (emoji: EmojiClickData) => {
    setShowEmojiPicker(false)

    // If user already reacted with this emoji, remove the reaction
    if (userReaction && userReaction.emoji === emoji.emoji) {
      removeReaction.mutate({ postId: post.id })
    } else {
      // Otherwise add or update the reaction
      addReaction.mutate({
        postId: post.id,
        emoji: emoji.emoji,
      })
    }
  }

  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      addComment.mutate({
        postId: post.id,
        comment: newComment,
      })
    }
  }

  // Get top 3 emojis
  const topEmojis = reactionCounts
    ? Object.entries(reactionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([emoji]) => emoji)
    : []

  // Count total reactions
  const totalReactions = reactionCounts ? Object.values(reactionCounts).reduce((sum, count) => sum + count, 0) : 0

  return (
    <div className="space-y-2 border-b pb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage src={post.author.imageUrl ?? undefined} />
            <AvatarFallback>{post.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <p className="text-md text-foreground flex items-center">
            {post.author.firstName}{" "}
            {post.author.role === "ADMIN" && (
              <LucideVerified className={"ml-2 text-blue-500 size-5"} />
            )}
          </p>
        </div>
        {auth.userId === post.authorId && (
          <div>
            <Popover>
              <PopoverTrigger>
                <Button size="icon" variant="ghost">
                  <LucideEllipsis className="size-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-36 flex flex-col p-1">
                <UpdatePostDialog post={post} />
                <Button
                  size="sm"
                  disabled={deletePost.isPending}
                  className="text-red-500 hover:text-red-800"
                  variant="ghost"
                  onClick={() => deletePost.mutate({ id: post.id })}
                >
                  {deletePost.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LucideTrash2 className="size-4 mr-2" />
                  )}
                  Excluir
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{format(post.createdAt, "PPp", { locale: ptBR })}</p>
      <h3 className="font-semibold">{post.title}</h3>
      {
        post.imageUrl &&
        <div className="w-full relative aspect-square">
          <Image src={post.imageUrl} fill alt={post.title} className="object-cover"/>
        </div>
      }
      {
        showMore ? 
        <div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          <button className="font-bold" onClick={()=>setShowMore(false)}>Ler menos...</button>
        </div>
        :
        <div>
          <p className="line-clamp-3">{post.content}</p>
          <button className="font-bold" onClick={()=>setShowMore(true)}>Ler mais...</button>
        </div>
      }

      {/* Reactions and Comments Section */}
      <div className="flex items-center justify-between mt-4 pt-2">
        {/* Reaction Display */}
        <div className="flex items-center">
          {topEmojis.length > 0 && (
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex mr-2 relative cursor-pointer">
                      {topEmojis.map((emoji, index) => (
                        <div
                          key={emoji}
                          className="rounded-full bg-muted flex items-center justify-center w-8 h-8 border-2 border-background"
                          style={{ marginLeft: index > 0 ? "-10px" : "0", zIndex: 3 - index }}
                        >
                          {emoji}
                        </div>
                      ))}
                      {totalReactions > 3 && (
                        <div
                          className="rounded-full bg-muted flex items-center justify-center w-8 h-8 border-2 border-background text-xs"
                          style={{ marginLeft: "-10px", zIndex: 0 }}
                        >
                          +{totalReactions - 3}
                        </div>
                      )}
                  </div>
                  </PopoverTrigger>
                    <PopoverContent className="w-64 p-0">
                      <div className="p-3 border-b">
                        <h4 className="font-medium">Reações</h4>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto">
                        {reactionCounts &&
                          Object.entries(reactionCounts)
                            .sort((a, b) => b[1] - a[1])
                            .map(([emoji, count]) => {
                              // Filtrar reações para este emoji
                              const reactionsForEmoji = reactions?.filter((r) => r.emoji === emoji) ?? []

                              return (
                                <div key={emoji} className="p-3 border-b last:border-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                      {emoji}
                                    </div>
                                    <span className="text-sm font-medium">
                                      {count} {count === 1 ? "pessoa" : "pessoas"}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {reactionsForEmoji.map((reaction) => (
                                      <div key={reaction.id} className="flex items-center gap-2">
                                        <Avatar className="size-6">
                                          <AvatarImage src={reaction.user.imageUrl ?? undefined} />
                                          <AvatarFallback>
                                            {reaction.user.firstName?.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">
                                          {reaction.user.firstName} {reaction.user.lastName}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clique para ver quem reagiu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                {!userReaction ? <><Smile className="h-4 w-4 mr-1" /> Reagir</> : <>{userReaction?.emoji} Reagir</> }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto bg-transparent p-0 border-none shadow-lg" align="start" side="top">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={theme as Theme}
                open
                width={300}
                height={400}
                reactionsDefaultOpen
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Comments Button */}
        <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <MessageSquare className="h-4 w-4 mr-1" />
              {comments && comments.length > 0
                ? `${comments.length} comentário${comments.length > 1 ? "s" : ""}`
                : "Comentar"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Comentários</DialogTitle>
              <DialogDescription>Comentários no post &quot;{post.title}&quot;</DialogDescription>
            </DialogHeader>

            <div className="max-h-[400px] overflow-y-auto py-4 space-y-4">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 group">
                    <Avatar className="size-8 mt-0.5">
                      <AvatarImage src={comment.user.imageUrl ?? undefined} />
                      <AvatarFallback>{comment.user.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">
                          {comment.user.firstName} {comment.user.lastName}
                        </p>
                        {comment.userId === auth.userId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteComment.mutate({ id: comment.id })}
                          >
                            <LucideTrash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm mt-1">{comment.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-2">
              <Avatar className="size-8">
                <AvatarImage src={userMe?.imageUrl ?? undefined} />
                <AvatarFallback>{userMe?.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newComment.trim() || addComment.isPending}>
                  {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview of first comment if exists */}
      {comments && comments.length > 0 && (
        <div
          className="mt-2 pl-2 border-l-2 border-muted cursor-pointer hover:bg-muted/50 p-2 rounded-sm transition-colors"
          onClick={() => setShowCommentDialog(true)}
        >
          <div className="flex items-center gap-2">
            <Avatar className="size-5">
              <AvatarImage src={comments?.at(0)?.user.imageUrl ?? undefined} />
              <AvatarFallback>{comments?.at(0)?.user.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium">{comments?.at(0)?.user.firstName}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{comments?.at(0)?.comment}</p>
          {comments.length > 1 && (
            <p className="text-xs text-muted-foreground mt-1">Ver todos os {comments.length} comentários</p>
          )}
        </div>
      )}
    </div>
  )
}

interface UpdatePostDialogProps {
  post: {
    id: string
    title: string
    content: string
  }
}

function UpdatePostDialog({ post }: UpdatePostDialogProps) {
  const utils = api.useUtils()
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const updatePost = api.post.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Post alterado",
        description: "Seu post foi alterado com sucesso.",
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

    updatePost.mutate({
      id: post.id,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      published: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <LucidePencil className="h-4 w-4 mr-2" />
          Editar Post
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Post</DialogTitle>
            <DialogDescription>Compartilhe uma novidade com a equipe</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" defaultValue={post.title} placeholder="Digite o título do post" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={post.content}
                placeholder="Digite o conteúdo do post"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updatePost.isPending}>
              {updatePost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
