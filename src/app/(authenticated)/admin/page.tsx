import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideCake, LucideMapPin, LucideUtensils } from "lucide-react";
import Link from "next/link";

export default function Page() {
	return (
		<div className="p-4">
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
					<Link href={'/admin/food'}>
						<Card>
							<CardHeader>
								<LucideUtensils/>
								<CardTitle>
									Almoços
								</CardTitle>
							</CardHeader>
							<CardFooter>
								<CardDescription>Gerencie os pedidos de Almoço 🍔</CardDescription>
							</CardFooter>
						</Card>
					</Link>
					<Link href={'/admin/suggestions'}>
						<Card>
							<CardHeader>
								<CardTitle>
									Sugestões (Avançado)
								</CardTitle>
							</CardHeader>
							<CardFooter>
								<CardDescription>Avalie e acompanhe as ideias 💡</CardDescription>
							</CardFooter>
						</Card>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}