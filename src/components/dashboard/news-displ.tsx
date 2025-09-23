"use client"

import { api } from "@/trpc/react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LucideArrowRight, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export default function NewsDisplay() {
  const { data: posts, isLoading } = api.post.list.useQuery();

  const displayPosts = posts?.slice(0, 3) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando notícias...</span>
      </div>
    );
  }

  if (displayPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Nenhuma notícia encontrada.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-full overflow-hidden gap-y-8 md:gap-y-12 lg:gap-y-16">
      {
        displayPosts.map((p, i)=>(
          <article key={i} className="group relative">
            {/* Card Container com Design Aprimorado */}
            <div className="bg-background border border-border/40 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:border-border">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
                {/* Imagem - Mobile: acima, Desktop: à esquerda */}
                <div className="w-full md:w-80 lg:w-96 md:flex-shrink-0">
                  <div className="relative overflow-hidden rounded-lg md:rounded-xl bg-muted/50 md:group-hover:scale-[1.02] md:transition-transform md:duration-300">
                    {
                    // p.imageUrl ?
                    // <Image
                    //   src={p.imageUrl} 
                    //   alt={p.title}
                    //   width={800}
                    //   height={600}
                    //   className="object-cover w-full h-auto max-h-[80vh] md:transition-transform md:duration-500 md:group-hover:scale-105"
                    //   style={{ aspectRatio: 'auto' }}
                    // />
                    // :
                    // p.author.imageUrl ?
                    // <div className="w-full h-full relative">
                    //     <Image
                    //       src={p.author.imageUrl}
                    //       alt={p.title}
                    //       width={800}
                    //       height={600}
                    //       className="object-cover w-full h-full"
                    //       style={{ aspectRatio: 'auto' }}
                    //     />
                    //     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg md:rounded-xl">
                    //       <div className="absolute bottom-0 left-0 right-0 p-4">
                    //         <p className="text-white font-semibold text-sm md:text-base line-clamp-2 drop-shadow-lg">
                    //           {p.title}
                    //         </p>
                    //       </div>
                    //     </div>
                    // </div>
                    // :
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                        <p className="text-primary font-bold text-2xl md:text-3xl">
                          {p.author.firstName?.at(0)}
                        </p>
                      </div>
                    </div>
                    }
                  </div>
                </div>

                {/* Conteúdo - Mobile: abaixo, Desktop: à direita */}
                <div className="flex-1 space-y-3 md:space-y-4 min-w-0">
                  {/* Título com melhor hierarquia */}
                  <div>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
                      {p.title}
                    </h2>
                    <div className="w-12 h-0.5 bg-primary/60 rounded-full"></div>
                  </div>

                  {/* Informações do autor e data */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 md:size-10 ring-2 ring-background shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {p.author.firstName?.at(0)}
                        </AvatarFallback>
                        <AvatarImage src={p.author.imageUrl ?? undefined}/>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm md:text-base text-foreground">
                          {p.author.firstName} {p.author.lastName}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo com melhor formatação */}
                  <div className="prose prose-sm md:prose-base max-w-none">
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3 md:line-clamp-4">
                      {p.content}
                    </p>
                  </div>

                  {/* Botão de ação melhorado */}
                  <div className="pt-2">
                    <Link href={`/news#${p.id}`} className="inline-block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                      >
                        <span className="mr-2">Ler notícia completa</span>
                        <LucideArrowRight className="w-4 h-4 md:group-hover/btn:translate-x-1 md:transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))
      }

      {/* Botão "Ver Mais" com design aprimorado */}
      <div className="flex justify-center pt-4 md:pt-8">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-full p-1">
          <Link href="/news">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 md:hover:scale-105"
            >
              <span className="mr-2">Ver todas as notícias</span>
              <LucideArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}