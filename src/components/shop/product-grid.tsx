"use client"

import { api } from "@/trpc/react";
import ProductCard from "./product-card";

export default function ProductGrid() {
    const { data: produtos, isLoading } = api.product.getAll.useQuery();
    
    if (isLoading) {
        const skeletonItems: number[] = []
        for (let i = 0; i < 8; i++) {
            skeletonItems.push(i)
        }
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {skeletonItems.map((i) => (
                    <div key={i} className="col-span-1 h-64 bg-muted animate-pulse rounded-lg" />
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
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 items-stretch">
            {
                produtos.map((p) => (
                    <div key={p.id} className="col-span-1 h-full">
                        <ProductCard product={p}/>
                    </div>
                ))
            }
        </div>
    );
}