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
          <div key={i} className="group flex even:flex-row-reverse even:text-end even:translate-x-32 odd:-translate-x-32 md:even:translate-x-0 md:odd:translate-x-0 relative gap-4">
            <div>
              <div className="flex items-center justify-center relative h-36 md:h-44 bg-muted rounded-md aspect-video">
                {
                 p.imageUrl ?
                 <Image src={p.imageUrl} className="object-cover rounded-md" fill alt={p.title} />
                 :
                 p.author.imageUrl ?
                 <div className="w-full h-full rounded-md">
                    <Image src={p.author.imageUrl} className="object-cover rounded-md" fill alt={p.title} />
                    <div className="absolute bg-background/80 backdrop-blur-sm drop-shadow-md rounded-md w-full h-full flex items-center justify-center">
                      {p.title}
                    </div>
                 </div>
                 :
                 <p>
                   {p.author.firstName?.at(0)}
                 </p>
                }
              </div>
            </div>
            <div className="min-w-[60dvw] space-y-3 overflow-hidden">
              <h1 className="text-md font-bold md:text-2xl overflow-ellipsis text-wrap">{p.title}</h1>
              <div className="flex w-full group-even:items-end flex-col">
                <div className="group-even:justify-start group-even:flex-row-reverse flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback>{p.author.firstName?.at(0)}</AvatarFallback>
                    <AvatarImage src={p.author.imageUrl ?? undefined}/>
                  </Avatar>
                  <p className="font-semibold">
                    {p.author.firstName} {p.author.lastName} 
                  </p>
                </div>
                <p className="text-muted-foreground">
                  {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              <p className="md:line-clamp-5 text-xs md:text-sm line-clamp-4">{p.content}</p>
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