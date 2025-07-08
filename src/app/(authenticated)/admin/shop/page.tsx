import { DashboardShell } from "@/components/dashboard-shell";
import ProductAdmin from "@/components/shop/product-admin";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminShopPage() {
    const user = await currentUser();

    if (user?.publicMetadata.role !== 'ADMIN') {
        redirect('/');
    }
    return (
        <DashboardShell>
            <div>
                <h1 className="text-3xl font-bold">
                    Gerenciamento de Produtos
                </h1>
                <h2 className="text-lg text-muted-foreground">
                    Adicione, edite ou remova os produtos da loja.
                </h2>
            </div>
            <ProductAdmin />
        </DashboardShell>
    );
} 