"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { LucideLink, LucideVerified } from "lucide-react"
import { type inferRouterOutputs } from "@trpc/server";

import { api } from "@/trpc/react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import Image from "next/image"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { type AppRouter } from "@/server/api/root"

// The number of seconds each slide will be displayed
const ROTATION_INTERVAL = 20 * 1000 // 10 seconds
type Post = inferRouterOutputs<AppRouter>["post"]["list"][number];
type Flyer = inferRouterOutputs<AppRouter>["flyer"]["list"][number];
type PostFlyerArr = {
  post: Post
  flyer: Flyer
};

export function PostList({ className }: { className?: string }) {
  const { data: posts, isLoading: isLoadingPosts } = api.post.list.useQuery()
  const { data: flyers, isLoading: isLoadingFlyers } = api.flyer.list.useQuery()
  const [combinedItems, setCombinedItems] = useState<Array<{ type: keyof PostFlyerArr; data: PostFlyerArr[keyof PostFlyerArr] }>>([])

  // Carousel API state
  const [carouselApi, setCarouselApi] = useState<CarouselApi>() // Renamed api to carouselApi to avoid conflict
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  // Combine posts and flyers into a single array for the carousel
  useEffect(() => {
    if (posts && flyers) {
      const postItems = posts.map((post) => ({ type: "post" as const, data: post }))
      const flyerItems = flyers.map((flyer) => ({ type: "flyer" as const, data: flyer }))
      setCombinedItems([...postItems, ...flyerItems])
    }
  }, [posts, flyers])

  // Set up carousel API
  useEffect(() => {
    if (!carouselApi) {
      return
    }

    setCount(carouselApi?.scrollSnapList().length)
    setCurrent(carouselApi?.selectedScrollSnap())

    carouselApi?.on("select", () => {
      setCurrent(carouselApi?.selectedScrollSnap())
    })
  }, [carouselApi])

  // Auto-rotate carousel
  useEffect(() => {
    if (!carouselApi || count === 0) return

    const interval = setInterval(() => {
      carouselApi.scrollNext()
    }, ROTATION_INTERVAL)

    return () => clearInterval(interval)
  }, [carouselApi, count])

  if (isLoadingPosts || isLoadingFlyers) {
    return (
      <div className={`${className} flex justify-center items-center`}>
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="space-y-8">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-64 w-full" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!combinedItems.length) {
    return (
      <div className={`${className} flex justify-center items-center h-screen`}>
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8 text-center">
            <p className="text-2xl text-muted-foreground">Nenhum conteúdo disponível.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className={`${className} flex flex-col justify-center items-center p-8`}>
      <Carousel
        className="w-full max-w-2xl"
        setApi={setCarouselApi} // Changed setApi to setCarouselApi
        opts={{
          loop: true,
          align: "center",
        }}
      >
        <CarouselContent>
          {combinedItems.map((item) => (
            <CarouselItem key={`${item.type}-${item.type === "post" ? item.data.id : item.data.id}`}>
              <div>
                <CardContent className="p-6">
                  {item.type === "post" ? <PostContent post={item.data as Post} /> : <FlyerContent flyer={item.data as Flyer} />}
                </CardContent>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Indicators */}
      {count > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              className={`h-3 w-3 rounded-full transition-colors ${index === current ? "bg-primary" : "bg-muted"}`}
              onClick={() => carouselApi?.scrollTo(index)} // Changed api to carouselApi
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

function PostContent({ post }: { post: Post }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={post.author.imageUrl ?? undefined} />
            <AvatarFallback>{post.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-medium text-foreground flex items-center">
              {post.author.firstName}{" "}
              {post.author.role === "ADMIN" ? (
                <LucideVerified className="ml-2 text-blue-500 size-6" />
              ) : (
                <LucideLink className="-rotate-45 ml-2 size-4 text-muted-foreground" />
              )}
            </p>
            <p className="text-md text-muted-foreground">{format(post.createdAt, "PPp", { locale: ptBR })}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{post.title}</h2>
        <p className="text-lg leading-relaxed">{post.content}</p>
      </div>
    </div>
  )
}

function FlyerContent({ flyer }: { flyer: Flyer }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage src={flyer.author.imageUrl ?? undefined} />
            <AvatarFallback>{flyer.author.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-medium text-foreground flex items-center">
              {flyer.author.firstName}{" "}
              {flyer.author.role === "ADMIN" ? (
                <LucideVerified className="ml-2 text-blue-500 size-6" />
              ) : (
                <LucideLink className="-rotate-45 ml-2 size-4 text-muted-foreground" />
              )}
            </p>
            <p className="text-md text-muted-foreground">{format(flyer.createdAt, "PPp", { locale: ptBR })}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{flyer.title}</h2>
        <div className="flex justify-center">
          <Image
            src={flyer.imageUrl || "/placeholder.svg?height=600&width=800"}
            width={800}
            height={600}
            alt={flyer.title}
            className="rounded-lg object-contain max-h-[50vh]"
            priority
          />
        </div>
        <p className="text-lg leading-relaxed">{flyer.description}</p>
      </div>
    </div>
  )
}

