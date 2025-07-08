import { DashboardShell } from "@/components/dashboard-shell";
import OrderAdmin from "@/components/shop/order-admin";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminOrdersPage() {
    const { userId } = await auth();
    if (!userId) return redirect("/");

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return redirect("/");

    const authorizedUser = await db.enterpriseConfig.findMany({ where: { shopNotificationEmail: user.email } });

    const userIsAdmin = user.role === "ADMIN" || authorizedUser.length > 0;

    if (userIsAdmin) {
        return (
            <DashboardShell>
                <div>
                    <h1 className="text-3xl font-bold">
                        Gerenciamento de Pedidos
                    </h1>
                    <h2 className="text-lg text-muted-foreground">
                        Visualize e gerencie os pedidos da loja.
                    </h2>
                </div>
                <OrderAdmin />
            </DashboardShell>
        );
    }

    const enterpriseConfigs = await db.enterpriseConfig.findMany({
        where: { shopNotificationEmail: user.email },
    });
    
    const isShopManager = enterpriseConfigs.length > 0;

    if (!isShopManager) {
        return redirect("/");
    }

    return (
        <DashboardShell>
            <div>
                <h1 className="text-3xl font-bold">
                    Gerenciamento de Pedidos
                </h1>
                <h2 className="text-lg text-muted-foreground">
                    Visualize e gerencie os pedidos da loja.
                </h2>
            </div>
            <OrderAdmin />
        </DashboardShell>
    );
} 