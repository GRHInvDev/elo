import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { checkAdminAccess } from "@/lib/access-control-server";
import { ADMIN_ROUTES, hasAccessToAdminRoute } from "@/const/admin-routes";

export default async function Page() {
    const db_user = await checkAdminAccess("/admin");
    
    // Filtrar rotas admin baseado nas permissões do usuário
    const availableRoutes = ADMIN_ROUTES.filter(route => {
        // Sempre mostrar a página principal /admin
        if (route.id === "/admin") return true;
        
        // Para usuários normais, verificar permissões
        if (!db_user.role_config?.sudo) {
            // Verificar acesso via admin_pages e permissões específicas
            return hasAccessToAdminRoute(
                db_user.role_config?.admin_pages || [], 
                route.id,
                db_user.role_config?.can_manage_produtos === true,
                db_user.role_config?.can_manage_quality_management === true
            );
        }
        
        // Sudo tem acesso a tudo
        return true;
    });

    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {availableRoutes
                        .filter(route => route.id !== "/admin") // Não mostrar a própria página
                        .map((route) => {
                            const IconComponent = route.icon;
                            return (
                                <Link key={route.path} href={route.path}>
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <IconComponent className="h-6 w-6" />
                                            <CardTitle>
                                                {route.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardFooter>
                                            <CardDescription>{route.description}</CardDescription>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            );
                        })}
                </CardContent>
            </Card>
        </div>
    );
}