"use client"

import type React from "react"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { LucideLink, LucideVerified } from "lucide-react"

import { api } from "@/trpc/react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import Image from "next/image"

export function PostList({ className }: { className?: string }) {
  const { data: posts, isLoading: isLoadingPosts } = api.post.list.useQuery()
  const { data: flyers } = api.flyer.list.useQuery()

  return (
    <div className={className}>
      <Card>
        <CardContent className="flex gap-2">
          <div className="p-4 mt-4 w-1/2">
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
                  <div key={post.id} className="space-y-2 border-b pb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={post.author.imageUrl ?? undefined} />
                          <AvatarFallback>{post.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="text-md text-foreground flex items-center">
                          {post.author.firstName} {post.author.role == "ADMIN" ? 
                          <LucideVerified className={"ml-2 text-blue-500 size-5"} />
                          :
                          <LucideLink className={"-rotate-45 ml-2 size-3 text-muted-foreground"} />}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(post.createdAt, "PPp", { locale: ptBR })}</p>
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-sm text-foreground">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 mt-4 w-1/2 border-l">
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
                          {flyer.author.firstName} {flyer.author.role == "ADMIN" ? 
                          <LucideVerified className={"ml-2 text-blue-500 size-5"} />
                          :
                          <LucideLink className={"-rotate-45 ml-2 size-3 text-muted-foreground"} />}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(flyer.createdAt, "PPp", { locale: ptBR })}</p>
                    <h3 className="font-medium">{flyer.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Image src={flyer.imageUrl} width={500} height={500} alt='' className="rounded-md"/>
                    </div>
                    <p className="text-sm text-muted-foreground">{flyer.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}