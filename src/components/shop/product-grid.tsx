import { api } from "@/trpc/server";
import ProductCard from "./product-card";

export default async function ProductGrid() {
    const produtos = await api.product.getAll();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {
                produtos.map((p, i)=>(
                    <div key={i} className="col-span-1">
                        <ProductCard product={p}/>
                    </div>
                ))
            }
        </div>
    );
}