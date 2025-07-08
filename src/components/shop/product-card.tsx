"use client"
import type {Product} from "@prisma/client"
import Image from "next/image"
import { Card, CardContent, /*CardDescription,*/ CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideBadgeInfo, LucideShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";

export default function ProductCard({ product }:{ product: Product }) {
    const { addItem } = useCart();
    const { toast } = useToast()

    const handleAddItem = () => {
        addItem(product);
        toast({
            title: "Produto adicionado!",
            description: `${product.name} foi adicionado ao seu carrinho.`,
        });
    };

    return (
        <Card className="overflow-hidden min-h-[24em] flex flex-col">
            <div>
              <div className="relative h-48 w-full">
                {
                    product.imageUrl.map((img, i)=>(
                        <Image
                          key={i}
                          src={img || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ))
                }
              </div>
              <div className="absolute -translate-y-16 w-full bg-gradient-to-t from-card/80 to-transparent h-16"/>
              <div className="absolute size-20 -translate-y-16 translate-x-2">
                <Image
                    src={product.enterprise.toLowerCase() == "box" ?"/LOGO BOX.png": product.enterprise.toLowerCase() == "cristallux" ? "/icon_cristal.svg" : "/Logo R Henz.png"}
                    alt={product.enterprise}
                    fill
                    className={"object-cover drop-shadow-md"}
                    sizes="(max-width: 100px) 100vw, (max-width: 200px) 50vw, 33vw"
                  />
              </div>
            </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{product.name}</CardTitle>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge>{product.enterprise}</Badge>
                    <p className="text-xl font-bold">{product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2 flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LucideBadgeInfo className="h-4 w-4" />
                  <span>{ product.description }</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="sm" onClick={handleAddItem}>
                    <LucideShoppingCart className="mr-2 h-4 w-4"/>
                    Adicionar ao carrinho
                </Button>
              </CardFooter>
            </Card>
    );
}