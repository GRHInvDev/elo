import { api } from "@/trpc/server";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LucideArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export default async function NewsDisplay() {
  const posts = (await api.post.list()).slice(0, 3);

  return (
    <div className="flex flex-col max-w-[100dvw] overflow-hidden gap-y-16">
      {
        posts.map((p, i)=>(
          <div key={i} className="border-t-2 pt-4 group flex flex-col md:flex-row relative gap-4">
            {/* Imagem - Mobile: acima, Desktop: à esquerda */}
            <div className="w-full md:w-auto md:flex-shrink-0">
              <div className="flex items-center justify-center relative h-48 md:h-44 bg-muted rounded-md aspect-video w-full md:w-auto">
                {
                p.imageUrl ?
                <Image src={p.imageUrl} className="object-cover rounded-md" fill alt={p.title} />
                :
                p.author.imageUrl ?
                <div className="w-full h-full rounded-md">
                    <Image src={p.author.imageUrl} className="object-cover rounded-md" fill alt={p.title} />
                    <div className="absolute bg-background/80 backdrop-blur-sm drop-shadow-md rounded-md w-full h-full flex items-center justify-center">
                      <div className="text-center px-4">
                        <p className="text-sm md:text-base font-semibold line-clamp-2">{p.title}</p>
                      </div>
                    </div>
                </div>
                :
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-full flex items-center justify-center">
                    <p className="text-primary-foreground font-bold text-lg md:text-xl">
                      {p.author.firstName?.at(0)}
                    </p>
                  </div>
                </div>
                }
              </div>
            </div>

            {/* Conteúdo - Mobile: abaixo, Desktop: à direita */}
            <div className="w-full space-y-3 overflow-hidden">
              <h1 className="text-lg font-bold md:text-2xl max-w-xl overflow-ellipsis text-wrap leading-tight">{p.title}</h1>
              <div className="flex w-full flex-col">
                <div className="flex items-center gap-2">
                  <Avatar className="size-6 md:size-8">
                    <AvatarFallback>{p.author.firstName?.at(0)}</AvatarFallback>
                    <AvatarImage src={p.author.imageUrl ?? undefined}/>
                  </Avatar>
                  <p className="font-semibold text-sm md:text-base">
                    {p.author.firstName} {p.author.lastName}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              <p className="mb-4 text-sm max-w-xl md:text-base md:line-clamp-2 line-clamp-3 leading-relaxed">{p.content}</p>
              <div className="flex justify-start md:justify-end max-w-xl">
                <Link href={`/news#${p.id}`}>
                  <Button className="w-full md:w-auto" variant="outline" size="sm">
                    Ler mais
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))
      }
      <div className="flex justify-center">
        <Link href="/news">
          <Button> Ver Mais <LucideArrowRight/></Button>
        </Link>
      </div>
    </div>
  );
}