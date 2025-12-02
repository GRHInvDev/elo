"use client"

import { memo, useCallback } from "react"
import type { Product } from "@prisma/client"
import Image from "next/image"
import { Card, CardContent, /*CardDescription,*/ CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideBadgeInfo, LucideShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { useCart } from "@/hooks/use-cart";

interface ProductCardProps {
  product: Product
  size?: "sm" | "md"
}

function ProductCard({ product, size = "md" }: ProductCardProps) {
  const { addItem } = useCart()

  const handleAddToCart = useCallback(() => {
    addItem(product, 1)
  }, [addItem, product])

  const imageHeightClass = size === "sm" ? "h-48" : "h-72"

  return (
    <Card className="overflow-hidden h-full flex flex-col print:border print:border-gray-300 print:min-h-[280px]">
      <div>
        <div className={`relative ${imageHeightClass} print:h-48 w-full`}>
          {
            product.imageUrl.map((img, i) => (
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
        <div className="absolute -translate-y-16 w-full bg-gradient-to-t from-card/80 to-transparent h-16 print:hidden" />
        <div className="absolute size-10 -translate-y-16 translate-x-2 print:hidden">
          <Image
            src={product.enterprise.toLowerCase() == "box" ? "/LOGO BOX.png" : product.enterprise.toLowerCase() == "cristallux" ? "/icon_cristal.svg" : "/Logo R Henz.png"}
            alt={product.enterprise}
            fill
            className={"object-cover drop-shadow-md"}
            sizes="(max-width: 50px) 100vw, (max-width: 100px) 50vw, 33vw"
          />
        </div>
      </div>
      <CardHeader className="pb-2 min-w-0 print:pb-2">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0 overflow-hidden print:max-w-[150px]">
            <CardTitle className="text-base print:text-xs print:mb-1 line-clamp-2 break-words print:line-clamp-1 print:truncate print:overflow-hidden print:text-ellipsis print:whitespace-nowrap print:max-w-full">
              <span className="print:hidden">{product.name}</span>
              <span className="hidden print:inline">
                {product.name.length > 20 ? `${product.name.substring(0, 20)}...` : product.name}
              </span>
            </CardTitle>
            {product.code && (
              <p className="text-xs text-muted-foreground mt-1 print:mt-1">Código: {product.code}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0 print:hidden">
            <Badge className="whitespace-nowrap text-xs">{product.enterprise}</Badge>
          </div>
        </div>
        <div className="mt-2 print:mt-2">
          <p className="text-lg font-bold text-primary truncate print:text-base">
            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-1 min-w-0 print:pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 print:text-xs">
          <LucideBadgeInfo className="h-3 w-3 flex-shrink-0 print:hidden" />
          <span className="line-clamp-2 break-words print:line-clamp-3 print:leading-normal">{product.description}</span>
        </div>
      </CardContent>
      <CardFooter className="print:hidden">
        <Button
          disabled={product.stock <= 0}
          className="w-full"
          size="sm"
          onClick={handleAddToCart}
        >
          <LucideShoppingCart />
          {product.stock <= 0 ? "Indisponível" : "Adicionar ao Carrinho"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default memo(ProductCard)