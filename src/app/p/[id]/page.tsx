import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Loader2, LucideExternalLink, LucideNewspaper } from "lucide-react"
import { db } from "@/server/db"
import { extractPostSummary } from "@/lib/share-post"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RedirectToFeed } from "./_components/redirect-to-feed"

interface PostSharePageProps {
  params: Promise<{ id: string }>
}

/**
 * Gera as metatags open graph para renderizar o card expandido com imagem
 */
export async function generateMetadata({ params }: PostSharePageProps): Promise<Metadata> {
  const { id } = await params

  if (!id) {
    return {
      title: "Publicação | Elo Intranet",
      description: "Confira as novidades na Elo Intranet.",
    }
  }

  const post = await db.post.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { order: "asc" },
      },
      author: {
        select: {
          firstName: true,
          lastName: true,
          enterprise: true,
        },
      },
    },
  })

  if (!post) {
    return {
      title: "Publicação não encontrada | Elo Intranet",
      description: "Esta publicação não existe ou foi removida.",
    }
  }

  const authorName = [post.author?.firstName, post.author?.lastName].filter(Boolean).join(" ")
  const enterprise = post.author?.enterprise
  const siteName = enterprise ? `${enterprise} • Elo Intranet` : "Elo Intranet"

  const description = extractPostSummary(post.content, 180) || "Confira os detalhes desta publicação no feed de notícias."
  const imageUrl = post.images?.[0]?.imageUrl ?? post.imageUrl ?? undefined

  return {
    title: `${post.title} | ${siteName}`,
    description,
    openGraph: {
      title: post.title,
      description,
      url: `/p/${post.id}`,
      siteName,
      type: "article",
      locale: "pt_BR",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

/**
 * Página pública de redirecionamento e metadados Open Graph para publicações do feed.
 */
export default async function PostSharePage({ params }: PostSharePageProps) {
  const { id } = await params

  const post = await db.post.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { order: "asc" },
      },
      author: {
        select: {
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
    },
  })

  if (!post) {
    notFound()
  }

  const imageUrl = post.images?.[0]?.imageUrl ?? post.imageUrl ?? undefined
  const summary = extractPostSummary(post.content, 160)

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      {/* Redirecionamento automático no client-side */}
      <RedirectToFeed postId={post.id} />

      <Card className="w-full max-w-md shadow-lg overflow-hidden border">
        {imageUrl && (
          <div className="relative w-full h-48 sm:h-56 bg-muted overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <LucideNewspaper className="h-3.5 w-3.5" />
            <span>Feed de Notícias</span>
          </div>
          <CardTitle className="text-lg sm:text-xl font-bold leading-snug line-clamp-2">
            {post.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {summary && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {summary}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2 border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Redirecionando para a publicação...</span>
            </div>

            <Link href={`/news#${post.id}`} className="w-full">
              <Button className="w-full" size="sm">
                <LucideExternalLink className="h-4 w-4 mr-2" />
                Acessar publicação agora
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
