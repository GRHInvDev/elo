"use client"

import type React from "react"
import type { RolesConfig } from "@/types/role-config"
import { useState } from "react"
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

export function NewsDisplay({ className }: { className?: string }) {
  const { data: posts, isLoading: isLoadingPosts } = api.post.list.useQuery()

  // Type cast dos dados para incluir role_config
  const postsWithRoleConfig = posts as PostWithAuthor[] | undefined

  return (
    <div className={`w-full max-w-none ${className ?? ""}`}>
      <div className="w-full max-w-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>News do Grupo RHenz</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="posts">
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
                  {postsWithRoleConfig?.slice(0, 3).map((post) => (
                    <PostItem key={post.id} post={post} />
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

function PostItem({ post }: PostItemProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <Card className="w-full max-w-none">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna da Imagem */}
          <div className="order-2 md:order-1">
            {(() => {
              // Processar imagens: priorizar array de imagens múltiplas, depois imageUrl única
              const imageUrls: string[] = []
              
              if (post.images && post.images.length > 0) {
                // Ordenar por 'order' e extrair URLs
                imageUrls.push(...post.images
                  .sort((a, b) => a.order - b.order)
                  .map(img => img.imageUrl)
                )
              } else if (post.imageUrl) {
                // Fallback para imagem única (compatibilidade com posts antigos)
                imageUrls.push(post.imageUrl)
              }
              
              return imageUrls.length > 0 ? (
                <ImageCarousel
                  images={imageUrls}
                  alt={post.title}
                  aspectRatio="auto"
                  showArrows={imageUrls.length > 1}
                  showDots={imageUrls.length > 1}
                  className="max-h-[300px]"
                  imageFit="contain"
                />
              ) : null
            })()}
          </div>

          {/* Coluna do Conteúdo */}
          <div className="order-1 md:order-2 space-y-4">
            {/* Avatar e Info do Autor */}
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

            {/* Título */}
            <h3 className="font-semibold text-lg">{post.title}</h3>

            {/* Texto do Post */}
            {showMore ? (
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-line">{post.content}</div>
                <button className="font-semibold text-xs text-muted-foreground mt-2" onClick={() => setShowMore(false)}>
                  Ler menos...
                </button>
              </div>
            ) : (
              <div>
                <p className="line-clamp-6 text-sm whitespace-pre-line">{post.content}</p>
              </div>
            )}

            {/* Botão Leia Mais */}
            <div className="pt-2">
              <Link href="/news">
                <Button variant="outline" size="sm">
                  Ler mais
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

