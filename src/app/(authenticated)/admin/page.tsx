import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterpriseEmailAdmin } from "@/components/enterprise-email-admin";
import { LucideCake, LucideClipboardList, LucideMapPin, LucideShoppingBag } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
    const user = await currentUser();

    if (user?.publicMetadata.role !== 'ADMIN') {
        redirect('/');
    }

    return (
        <div className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <Link href={'/admin/rooms'}>
                        <Card>
                            <CardHeader>
                                <LucideMapPin/>
                                <CardTitle>
                                    Salas
                                </CardTitle>
                            </CardHeader>
                            <CardFooter>
                                <CardDescription>Gerenciar salas de reunião 📑</CardDescription>
                            </CardFooter>
                        </Card>
                    </Link>
                    <Link href={'/admin/birthday'}>
                        <Card>
                            <CardHeader>
                                <LucideCake/>
                                <CardTitle>
                                    Aniversários
                                </CardTitle>
                            </CardHeader>
                            <CardFooter>
                                <CardDescription>Gerencie os aniversários 🎉</CardDescription>
                            </CardFooter>
                        </Card>
                    </Link>
                    <Link href={'/admin/shop'}>
                        <Card>
                            <CardHeader>
                                <LucideShoppingBag/>
                                <CardTitle>
                                    Produtos
                                </CardTitle>
                            </CardHeader>
                            <CardFooter>
                                <CardDescription>Gerencie os produtos da loja 🛍️</CardDescription>
                            </CardFooter>
                        </Card>
                    </Link>
                    <Link href={'/admin/orders'}>
                        <Card>
                            <CardHeader>
                                <LucideClipboardList/>
                                <CardTitle>
                                    Pedidos
                                </CardTitle>
                            </CardHeader>
                            <CardFooter>
                                <CardDescription>Gerencie os pedidos da loja 📦</CardDescription>
                            </CardFooter>
                        </Card>
                    </Link>
                </CardContent>
            </Card>
            <EnterpriseEmailAdmin />
        </div>
    );
}