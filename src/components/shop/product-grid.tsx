"use client"

import { memo } from "react"
import { api } from "@/trpc/react";
import ProductCard from "./product-card";
import type { Enterprise } from "@prisma/client";

interface ProductGridProps {
  size?: "sm" | "md"
  enterpriseFilter?: Enterprise | "ALL"
  nameFilter?: string
  priceFilter?: "ALL" | "0-50" | "50-100" | "100-200" | "200+"
}

function ProductGrid({ 
  size = "md", 
  enterpriseFilter = "ALL",
  nameFilter = "",
  priceFilter = "ALL"
}: ProductGridProps) {
    const { data: produtos, isLoading } = api.product.getAll.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
    
    if (isLoading) {
        const skeletonItems: number[] = []
        for (let i = 0; i < 8; i++) {
            skeletonItems.push(i)
        }
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 w-full max-w-full overflow-x-hidden">
                {skeletonItems.map((i) => (
                    <div key={i} className="col-span-1 h-56 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }
    
    if (!produtos || produtos.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum produto disponível no momento.</p>
            </div>
        );
    }
    
    const filtered = produtos?.filter((p) => {
      // Filtro por empresa
      if (enterpriseFilter !== "ALL" && p.enterprise !== enterpriseFilter) {
        return false
      }

      // Filtro por nome
      if (nameFilter.trim() !== "") {
        const searchTerm = nameFilter.toLowerCase().trim()
        const productName = p.name.toLowerCase()
        const productDescription = p.description?.toLowerCase() || ""
        if (!productName.includes(searchTerm) && !productDescription.includes(searchTerm)) {
          return false
        }
      }

      // Filtro por preço
      if (priceFilter !== "ALL") {
        const price = p.price
        switch (priceFilter) {
          case "0-50":
            if (price > 50) return false
            break
          case "50-100":
            if (price <= 50 || price > 100) return false
            break
          case "100-200":
            if (price <= 100 || price > 200) return false
            break
          case "200+":
            if (price <= 200) return false
            break
        }
      }

      return true
    }) || []

    if (filtered.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum produto encontrado com os filtros aplicados.</p>
            </div>
        );
    }

    // Ordenar produtos filtrados alfabeticamente por nome
    const sorted = [...filtered].sort((a, b) => {
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
    })

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 print:grid-cols-3 print:gap-4 gap-3 items-stretch w-full max-w-full overflow-x-hidden">
            {
                sorted.map((p) => (
                    <div key={p.id} className="col-span-1 h-full w-full max-w-full print:break-inside-avoid">
                        <ProductCard product={p} size={size}/>
                    </div>
                ))
            }
        </div>
    );
}

export default memo(ProductGrid)