import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideCake, LucideMapPin, LucideUtensils, Lightbulb, Users } from "lucide-react";
import Link from "next/link";
import { checkAdminAccess, hasAdminAccess } from "@/lib/access-control";

export default async function Page() {
    const db_user = await checkAdminAccess("/admin");
    
    // Definir módulos admin disponíveis
    const adminModules = [
        {
            href: '/admin/users',
            route: '/users',
            icon: Users,
            title: 'Usuários',
            description: 'Gerenciar usuários e permissões 👥'
        },
        {
            href: '/admin/rooms',
            route: '/rooms',
            icon: LucideMapPin,
            title: 'Salas',
            description: 'Gerenciar salas de reunião 📑'
        },
        {
            href: '/admin/birthday',
            route: '/birthday',
            icon: LucideCake,
            title: 'Aniversários',
            description: 'Gerencie os aniversários 🎉'
        },
        {
            href: '/admin/food',
            route: '/food',
            icon: LucideUtensils,
            title: 'Almoços',
            description: 'Gerencie os pedidos de Almoço 🍔'
        },
        {
            href: '/admin/suggestions',
            route: '/ideas',
            icon: Lightbulb,
            title: 'Ideias',
            description: 'Gerencie as Ideias 💡'
        }
    ];

    // Filtrar módulos baseado nas permissões
    const availableModules = adminModules.filter(module => {
        // Página de usuários só para sudo
        if (module.route === '/users') {
            return db_user.role_config?.sudo === true;
        }
        // Outras páginas usam a verificação padrão
        return hasAdminAccess(db_user.role_config, module.route);
    });

    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {availableModules.map((module) => {
                        const IconComponent = module.icon;
                        return (
                            <Link key={module.href} href={module.href}>
                                <Card>
                                    <CardHeader>
                                        <IconComponent/>
                                        <CardTitle>
                                            {module.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardFooter>
                                        <CardDescription>{module.description}</CardDescription>
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