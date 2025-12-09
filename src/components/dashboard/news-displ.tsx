"use client"

import type React from "react"
import type { RolesConfig } from "@/types/role-config"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { LucideVerified } from "lucide-react"
import Link from "next/link"
import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageCarousel } from "@/components/ui/image-carousel"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

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
  images?: Array<{ id: string; imageUrl: string; order: number }>
  createdAt: Date
  author: AuthorWithRoleConfig
}

interface PostItemProps {
  post: PostWithAuthor
}

/**
 * Render a compact post card showing image(s), author, date, title, a short markdown excerpt, and a "Ver mais" link.
 *
 * @param post - The post object (with author and optional images) to display in compact form.
 * @returns A JSX element representing the compact post card suitable for use in a grid or list.
 */
function PostItemCompact({ post }: PostItemProps) {
  // Processar imagens: priorizar array de imagens múltiplas, depois imageUrl única
  const imageUrls: string[] = []
  
  if (post.images && post.images.length > 0) {
    imageUrls.push(...post.images
      .sort((a, b) => a.order - b.order)
      .map(img => img.imageUrl)
    )
  } else if (post.imageUrl) {
    imageUrls.push(post.imageUrl)
  }

  return (
    <Card className="w-full overflow-hidden hover:shadow-lg transition-shadow duration-300 rounded-2xl flex flex-col h-full">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Imagem no topo */}
        {imageUrls.length > 0 && (
          <div className="relative h-48 md:h-56 overflow-hidden bg-muted">
            <ImageCarousel
              images={imageUrls}
              alt={post.title}
              aspectRatio="auto"
              showArrows={imageUrls.length > 1}
              showDots={imageUrls.length > 1}
              className="h-full w-full"
              imageFit="cover"
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="p-4 space-y-3 flex flex-col flex-1">
          {/* Header com Avatar e Data */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-background">
              <AvatarImage src={post.author.imageUrl ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {post.author.firstName?.charAt(0).toUpperCase()}
                {post.author.lastName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1 truncate">
                {post.author.firstName} {post.author.lastName}
                {post.author.role_config?.sudo && (
                  <LucideVerified className="text-blue-500 size-3 flex-shrink-0" />
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(post.createdAt, "d 'de' MMM", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Título */}
          <h3 className="font-bold text-base md:text-lg leading-tight text-foreground line-clamp-2">
            {post.title}
          </h3>

          {/* Texto do Post */}
          <div className="text-xs text-muted-foreground flex-1 overflow-hidden">
            <div className="line-clamp-3">
              <MarkdownRenderer content={post.content} />
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="pt-2 border-t">
            <Link href="/news">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Ver mais
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Render the News feed UI with a featured post and a responsive grid of additional posts.
 *
 * Fetches post data and displays one of three states: loading skeletons while posts load,
 * a centered message when there are no posts, or the content layout when posts are available.
 * When posts exist the first post is shown as the featured item and up to three subsequent posts
 * are shown in a 3-column responsive grid. The component uses tabs with a single "posts" view.
 *
 * @param className - Optional additional CSS classes applied to the root container
 * @returns A React element containing the news feed UI including header, tabs, and posts (or loading/empty states)
 */
export function NewsDisplay({ className }: { className?: string }) {
  const { data: posts, isLoading: isLoadingPosts } = api.post.list.useQuery()

  // Type cast dos dados para incluir role_config
  const postsWithRoleConfig = posts as PostWithAuthor[] | undefined

  return (
    <div className={`w-full max-w-none ${className ?? ""}`}>
      <div className="w-full max-w-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl md:text-3xl mb-2">News do Grupo RHenz</CardTitle>
              <p className="text-sm text-muted-foreground">Fique por dentro das últimas novidades</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="posts">
            <TabsContent value="posts" className="mt-0">
              {isLoadingPosts ? (
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                        <Skeleton className="h-48 w-full md:col-span-1" />
                        <div className="md:col-span-2 space-y-3">
                          <Skeleton className="h-6 w-2/3" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : !postsWithRoleConfig?.length ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">Nenhum post publicado ainda.</p>
                  <p className="text-sm text-muted-foreground/70">Fique atento para novidades em breve!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Post em Destaque (Mais Recente) */}
                  {postsWithRoleConfig[0] && (
                    <div>
                      <PostItem key={postsWithRoleConfig[0].id} post={postsWithRoleConfig[0]} />
                    </div>
                  )}
                  
                  {/* Posts em 3 Colunas */}
                  {postsWithRoleConfig.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      {postsWithRoleConfig.slice(1, 4).map((post) => (
                        <PostItemCompact key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </div>
    </div>
  )
}

/**
 * Render a detailed card for a single post including author info, formatted date, image(s) if present, and a constrained content preview.
 *
 * The component displays an image carousel when the post has images (or a single image fallback), an author avatar with initials fallback, a localized creation date, the post title, and a markdown-rendered excerpt constrained to 100px with a gradient overlay. Includes an action button linking to the full posts list.
 *
 * @param post - The post data with author metadata used to populate the card (title, content, images, imageUrl, createdAt, and author fields).
 * @returns A JSX element representing the post card.
 */
function PostItem({ post }: PostItemProps) {

  // Processar imagens: priorizar array de imagens múltiplas, depois imageUrl única
  const imageUrls: string[] = []
  
  if (post.images && post.images.length > 0) {
    imageUrls.push(...post.images
      .sort((a, b) => a.order - b.order)
      .map(img => img.imageUrl)
    )
  } else if (post.imageUrl) {
    imageUrls.push(post.imageUrl)
  }

  return (
    <Card className="w-full max-w-none overflow-hidden hover:shadow-lg transition-shadow duration-300 rounded-2xl">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Coluna da Imagem */}
          {imageUrls.length > 0 && (
            <div className="relative h-48 md:h-auto md:min-h-[240px] overflow-hidden bg-muted">
              <ImageCarousel
                images={imageUrls}
                alt={post.title}
                aspectRatio="auto"
                showArrows={imageUrls.length > 1}
                showDots={imageUrls.length > 1}
                className="h-full w-full"
                imageFit="cover"
              />
            </div>
          )}

          {/* Coluna do Conteúdo */}
          <div className={`p-6 space-y-4 ${imageUrls.length > 0 ? 'md:col-span-2' : 'md:col-span-3'} flex flex-col`}>
            {/* Header com Avatar e Data */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                  <AvatarImage src={post.author.imageUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {post.author.firstName?.charAt(0).toUpperCase()}
                    {post.author.lastName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                    {post.author.firstName} {post.author.lastName}
                    {post.author.role_config?.sudo && (
                      <LucideVerified className="text-blue-500 size-4" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(post.createdAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>

            {/* Título */}
            <h3 className="font-bold text-xl md:text-2xl leading-tight text-foreground">
              {post.title}
            </h3>

            {/* Texto do Post - Limitado a 100px de altura */}
            <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden relative" style={{ maxHeight: '100px' }}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none z-10" />
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Botão de Ação */}
            <div className="pt-2 border-t mt-auto">
              <Link href="/news">
                <Button variant="outline" size="sm" className="w-full md:w-auto">
                  Ver post completo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
