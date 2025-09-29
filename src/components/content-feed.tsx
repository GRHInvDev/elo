"use client"

import type React from "react"
import type { RolesConfig } from "@/types/role-config"
import { useEffect, useRef, useState } from "react"
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
  Send,
} from "lucide-react"
import dynamic from "next/dynamic"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import { MultipleImageUpload } from "./ui/multiple-image-upload"
import { ImageCarousel } from "./ui/image-carousel"

// Define interfaces específicas para os tipos de dados
interface AuthorWithRoleConfig {
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  role_config: RolesConfig
  enterprise?: string
}

interface PostWithAuthor {
  id: string
  title: string
  content: string
  authorId: string
  imageUrl: string | null
  images?: Array<{ imageUrl: string }>
  createdAt: Date
  author: AuthorWithRoleConfig
}

interface EventWithAuthor {
  id: string
  title: string
  description: string
  location: string
  startDate: Date
  endDate: Date
  authorId: string
  published: boolean
  createdAt: Date
  author: AuthorWithRoleConfig
}

interface FlyerWithAuthor {
  id: string
  title: string
  description: string
  imageUrl: string
  iframe: string | null
  authorId: string
  published: boolean
  createdAt: Date
  author: AuthorWithRoleConfig
}

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react").then((mod) => mod.default), { ssr: false })

export function ContentFeed({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [fileUrl] = useState<string | undefined>(undefined)
  const [images, setImages] = useState<string[]>([])
  const [loading] = useState(false)
  const { toast } = useToast()
  const utils = api.useUtils()

  const { data: posts, isLoading: isLoadingPosts } = api.post.list.useQuery()
  const { data: events } = api.event.list.useQuery()
  const { data: flyers } = api.flyer.list.useQuery()

  // Type cast dos dados para incluir role_config
  const postsWithRoleConfig = posts as PostWithAuthor[] | undefined
  const eventsWithRoleConfig = events as EventWithAuthor[] | undefined
  const flyersWithRoleConfig = flyers as FlyerWithAuthor[] | undefined

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
      content: normalizeLineBreaks(formData.get("content") as string),
      published: true,
      imageUrl: fileUrl, // Mantido para compatibilidade
      images: images.length > 0 ? images : undefined, // Novas imagens múltiplas
    })
  }

  return (
    <div className={className}>
      <div>
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
                      <Label>Imagens</Label>
                      <MultipleImageUpload
                        onImagesChange={setImages}
                        maxImages={10}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea
                        id="content"
                        name="content"
                        placeholder="Digite o conteúdo do post. Pressione Enter para criar quebras de linha."
                        required
                      />
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
        <CardContent className="p-0 md:p-6">
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
              ) : !postsWithRoleConfig?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum post publicado ainda.</p>
              ) : (
                <div className="space-y-4">
                  {postsWithRoleConfig?.map((post) => (
                    <PostItem key={post.id} post={post} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="events" className="mt-4">
              {!eventsWithRoleConfig?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento agendado.</p>
              ) : (
                <div className="space-y-4">
                  {eventsWithRoleConfig?.map((event) => (
                    <Card key={event.id}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={event.author.imageUrl ?? undefined} />
                            <AvatarFallback>{event.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-foreground flex items-center">
                              {event.author.firstName}
                              {event.author.role_config?.sudo ? (
                                <LucideVerified className={"ml-2 text-blue-500 size-4"} />
                              ) : (
                                <LucideLink className={"-rotate-45 ml-2 size-3 text-muted-foreground"} />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">agendou um evento</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      </CardContent>
                      <CardFooter>
                        <div className="flex items-center text-sm text-muted-foreground font-medium">
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(event.startDate, "PPPp", { locale: ptBR })}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="flyers" className="mt-4">
              {!flyersWithRoleConfig?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum encarte publicado.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {flyersWithRoleConfig?.map((flyer) => (
                    <Card key={flyer.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={flyer.author.imageUrl ?? undefined} />
                            <AvatarFallback>{flyer.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-foreground flex items-center">
                              {flyer.author.firstName}
                              {flyer.author.role_config?.sudo ? (
                                <LucideVerified className={"ml-2 text-blue-500 size-4"} />
                              ) : (
                                <LucideLink className={"-rotate-45 ml-2 size-3 text-muted-foreground"} />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(flyer.createdAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <h3 className="font-semibold mb-2">{flyer.title}</h3>
                        <div className="flex items-center justify-center">
                          {flyer.iframe ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="relative aspect-[1/1.414] w-full cursor-pointer overflow-hidden rounded-md">
                                  <Image
                                    src={flyer.imageUrl || "/placeholder.svg"}
                                    alt={flyer.title}
                                    fill
                                    className="object-cover transition-transform hover:scale-105"
                                  />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="block h-full w-full max-w-none p-0 sm:h-[95vh] sm:w-auto sm:max-w-7xl sm:rounded-lg">
                                <iframe src={flyer.iframe} className="w-full h-full border-0" />
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <div className="relative aspect-[1/1.414] w-full overflow-hidden rounded-md">
                              <Image
                                src={flyer.imageUrl || "/placeholder.svg"}
                                alt={flyer.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                      {flyer.description && (
                        <CardFooter>
                          <p className="text-sm text-muted-foreground">{flyer.description}</p>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </div>
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
      role_config?: RolesConfig
      enterprise?: string
    }
    createdAt: Date
  }
}

// Função utilitária para normalizar quebras de linha (CRLF -> LF)
function normalizeLineBreaks(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

// Hook para detectar quando um elemento fica visível
function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry?.isIntersecting ?? false)
      },
      {
        threshold: 0.5, // 50% do elemento precisa estar visível
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return { isIntersecting }
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
  const postRef = useRef<HTMLDivElement>(null)
  const viewIncrementedRef = useRef(false)
  const currentPostIdRef = useRef(post.id)

  // Resetar o contador quando o post muda
  useEffect(() => {
    if (currentPostIdRef.current !== post.id) {
      viewIncrementedRef.current = false
      currentPostIdRef.current = post.id
    }
  }, [post.id])

  // Hook para detectar visualização
  const { isIntersecting } = useIntersectionObserver(postRef, {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px' // Trigger quando 100px do elemento estiverem visíveis
  })

  // Incrementar visualização quando o post é visto pela primeira vez
  const incrementView = api.post.incrementView.useMutation()
  useEffect(() => {
    if (isIntersecting && post.id && !viewIncrementedRef.current) {
      viewIncrementedRef.current = true
      incrementView.mutate({ id: post.id })
    }
  }, [isIntersecting, post.id, incrementView])

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
    <Card ref={postRef} className="w-full" id={post.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={post.author.imageUrl ?? undefined} />
              <AvatarFallback>{post.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center">
                {post.author.firstName} {post.author.lastName}
                {post.author.role_config?.sudo && <LucideVerified className={"ml-2 text-blue-500 size-4"} />}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(post.createdAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          {auth.userId === post.authorId && (
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <LucideEllipsis className="size-4" />
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
      </CardHeader>

      <CardContent className="space-y-4 pb-2 p-0 md:px-6">
        <h3 className="font-semibold px-6">{post.title}</h3>
        {showMore ? (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none px-6 md:px-0">
            <div className="whitespace-pre-line">{post.content}</div>
            <button className="font-semibold text-xs text-muted-foreground mt-2" onClick={() => setShowMore(false)}>
              Ler menos...
            </button>
          </div>
        ) : (
          <div className="px-6 md:px-0">
            <p className="line-clamp-3 text-sm whitespace-pre-line">{post.content}</p>
            {post.content.length > 250 && (
              <button className="font-semibold text-xs text-muted-foreground mt-2" onClick={() => setShowMore(true)}>
                Ler mais...
              </button>
            )}
          </div>
        )}
        {/* {(post.imageUrl ?? (post.images?.length ?? 0) > 0) && (
          <div className="mt-2">
            <ImageCarousel
              images={
                (post.images?.length ?? 0) > 0 
                  ? post.images?.map((img: { imageUrl: string }) => img.imageUrl) ?? []
                  : post.imageUrl 
                    ? [post.imageUrl]
                    : []
              }
              alt={post.title}
              aspectRatio="video"
              showArrows={true}
              showDots={true}
            />
          </div>
        )} */}
      </CardContent>

      {(totalReactions > 0 || (comments && comments.length > 0)) && (
        <div className="px-6 pt-2 pb-2 flex items-center justify-between text-xs text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-1"
                  onClick={() => {
                    /* Open reactions dialog/popover */
                  }}
                >
                  {topEmojis.slice(0, 3).map((emoji) => (
                    <span key={emoji}>{emoji}</span>
                  ))}
                  {totalReactions > 0 && <span className="ml-1">{totalReactions}</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-h-[250px] overflow-y-auto">
                  {reactionCounts &&
                    Object.entries(reactionCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([emoji, count]) => {
                        const reactionsForEmoji = reactions?.filter((r) => r.emoji === emoji) ?? []
                        return (
                          <div key={emoji} className="p-2 border-b last:border-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                                {emoji}
                              </div>
                              <span className="text-sm font-medium">
                                {count} {count === 1 ? "pessoa" : "pessoas"}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {reactionsForEmoji.map((reaction) => (
                                <div key={reaction.id} className="flex items-center gap-2">
                                  <Avatar className="size-5">
                                    <AvatarImage src={reaction.user.imageUrl ?? undefined} />
                                    <AvatarFallback>{reaction.user.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs">
                                    {reaction.user.firstName} {reaction.user.lastName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {comments && comments.length > 0 && (
            <button onClick={() => setShowCommentDialog(true)} className="hover:underline">
              {comments.length} comentário{comments.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      <div className="border-t border-b mx-6 my-2">
        <div className="flex justify-around items-center">
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground">
                {!userReaction ? (
                  <>
                    <Smile className="h-5 w-5 mr-1" /> Reagir
                  </>
                ) : (
                  <>
                    <span className="text-xl mr-2">{userReaction?.emoji}</span> Reagir
                  </>
                )}
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
          <div className="w-px bg-border h-6" />
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-muted-foreground"
            onClick={() => setShowCommentDialog(true)}
          >
            <MessageSquare className="h-5 w-5 mr-1" />
            Comentar
          </Button>
        </div>
      </div>

      <CardFooter className="flex flex-col items-start gap-3 pt-2">
        {comments && comments.length > 0 && (
          <div
            className="w-full space-y-2 mt-2 cursor-pointer"
            onClick={() => setShowCommentDialog(true)}
          >
            <div className="flex items-start gap-2">
              <Avatar className="size-6 border">
                <AvatarImage src={comments?.at(0)?.user.imageUrl ?? undefined} />
                <AvatarFallback>{comments?.at(0)?.user.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-sm bg-muted/50 rounded-lg px-3 py-1.5 w-full">
                <span className="font-semibold">{comments?.at(0)?.user.firstName}</span>
                <p className="text-muted-foreground line-clamp-2">{comments?.at(0)?.comment}</p>
              </div>
            </div>
            {comments.length > 1 && (
              <p className="text-xs text-muted-foreground ml-8">Ver todos os {comments.length} comentários</p>
            )}
          </div>
        )}

        <form onSubmit={handleCommentSubmit} className="w-full flex gap-2 mt-2 items-center">
          <Avatar className="size-8">
            <AvatarImage src={userMe?.imageUrl ?? undefined} />
            <AvatarFallback>{userMe?.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Input
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="pr-10"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              disabled={!newComment.trim() || addComment.isPending}
            >
              {addComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Comentários no post de {post.author.firstName}</DialogTitle>
            </DialogHeader>

            <div className="max-h-[50vh] overflow-y-auto py-4 space-y-4">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 group items-start">
                    <Avatar className="size-8 mt-0.5 border">
                      <AvatarImage src={comment.user.imageUrl ?? undefined} />
                      <AvatarFallback>{comment.user.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">
                          {comment.user.firstName} {comment.user.lastName}
                        </p>
                        {(comment.userId === auth.userId || userMe?.role_config?.sudo) && (
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

            <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-2 pt-4 border-t">
              <Avatar className="size-8">
                <AvatarImage src={userMe?.imageUrl ?? undefined} />
                <AvatarFallback>{userMe?.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Input
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  disabled={!newComment.trim() || addComment.isPending}
                >
                  {addComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
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
      content: normalizeLineBreaks(formData.get("content") as string),
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
                placeholder="Digite o conteúdo do post. Pressione Enter para criar quebras de linha."
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
