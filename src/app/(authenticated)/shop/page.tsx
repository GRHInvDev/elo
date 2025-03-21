import { DashboardShell } from "@/components/dashboard-shell";
import ProductGrid from "@/components/shop/product-grid";

export default function ShopPage() {
    return (
        <DashboardShell>
            <div>
                <h1 className="text-3xl font-bold">
                    RHenz Shop
                </h1>
                <h2 className="text-lg text-muted-foreground">
                    Compre itens com as marcas do Grupo RHenz 
                </h2>
            </div>
            <ProductGrid/>
        </DashboardShell>
    );
}