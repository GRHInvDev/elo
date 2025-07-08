import { DashboardShell } from "@/components/dashboard-shell";
import { CartDialog } from "@/components/shop/cart-dialog";
import ProductGrid from "@/components/shop/product-grid";

export default function ShopPage() {
    return (
        <DashboardShell>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        RHenz Shop
                    </h1>
                    <h2 className="text-lg text-muted-foreground">
                        Compre itens com as marcas do Grupo RHenz 
                    </h2>
                </div>
                <CartDialog />
            </div>
            <ProductGrid/>
        </DashboardShell>
    );
}