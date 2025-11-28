"use client"

import { memo } from "react"
import { api } from "@/trpc/react";
import ProductCard from "./product-card";
import type { Enterprise } from "@prisma/client";

interface ProductGridProps {
  size?: "sm" | "md"
  enterpriseFilter?: Enterprise | "ALL"
}

function ProductGrid({ size = "md", enterpriseFilter = "ALL" }: ProductGridProps) {
    const { data: produtos, isLoading } = api.product.getAll.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
    
    if (isLoading) {
        const skeletonItems: number[] = []
        for (let i = 0; i < 8; i++) {
            skeletonItems.push(i)
        }
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
    
    const filtered = produtos?.filter((p) =>
      enterpriseFilter === "ALL" || p.enterprise === enterpriseFilter
    ) || []

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-stretch">
            {
                filtered.map((p) => (
                    <div key={p.id} className="col-span-1 h-full">
                        <ProductCard product={p} size={size}/>
                    </div>
                ))
            }
        </div>
    );
}

export default memo(ProductGrid)