import { DashboardShell } from "@/components/dashboard-shell";
import ProductGrid from "@/components/shop/product-grid";
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { api } from "@/trpc/server"
import { canViewShop } from "@/lib/access-control"

export default async function ShopPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in?redirect_url=/shop")
  }

  // Verificar se o usuário tem permissão para visualizar a página de shop
  if (!canViewShop()) {
    redirect("/dashboard")
  }
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