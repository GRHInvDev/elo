"use client"

import { api } from "@/trpc/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Order = RouterOutput["order"]["getAll"][number];
type OrderItem = Order["items"][number];

const statusMap: Record<string, string> = {
    PENDING: "Pendente",
    PROCESSING: "Em Processamento",
    COMPLETED: "Enviado para separação",
    CANCELED: "Cancelado"
}

const paymentMethodMap: Record<string, string> = {
    PIX: "Pix",
    BOLETO: "Boleto"
}

const OrderItemDisplay = ({ item }: { item: OrderItem }) => (
    <div className="flex items-center gap-2">
        <Avatar className="size-12 mr-2">
            <AvatarImage className="rounded-md" src={item.product.imageUrl?.[0] ?? undefined} />
            <AvatarFallback className="rounded-md">{item.product.name.at(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
            <p className="font-semibold">{item.product.name}</p>
            <p className="text-sm text-muted-foreground">x{item.quantity}</p>
        </div>
        <p className="text-sm font-medium ml-auto">
            {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
    </div>
);

export default function OrderAdmin() {
    const { data: orders, isLoading } = api.order.getAll.useQuery();
    const { toast } = useToast();
    const utils = api.useUtils();

    const updateStatusMutation = api.order.updateStatus.useMutation({
        onSuccess: () => {
            toast({ title: "Status do pedido atualizado com sucesso" });
            void utils.order.getAll.invalidate();
        },
        onError: (error) => {
            toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
        }
    })

    const handleStatusChange = (orderId: string, status: string) => {
        updateStatusMutation.mutate({ orderId, status });
    }

    return (
        <div className="rounded-md border mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Produto(s)</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </TableCell>
                        </TableRow>
                    ) : orders?.length ? (
                        orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="flex items-center min-w-fit">
                                    <Avatar className="size-8 mr-2">
                                        <AvatarImage src={order.user.imageUrl ?? undefined} />
                                        <AvatarFallback>{order.user.firstName?.at(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <p className="font-semibold">{order.user.firstName} {order.user.lastName}</p>
                                        <p className="text-sm text-muted-foreground">{order.user.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {order.items.length > 1 ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <div className="flex items-center gap-2 cursor-pointer">
                                                    <div className="flex -space-x-4">
                                                        {order.items.slice(0, 2).map(item => (
                                                            <Avatar key={item.id} className="size-10 border-2 border-background">
                                                                <AvatarImage className="rounded-md" src={item.product.imageUrl?.[0] ?? undefined} />
                                                                <AvatarFallback className="rounded-md">{item.product.name.at(0)}</AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                         {order.items.length > 2 && (
                                                            <Avatar className="size-10 border-2 border-background">
                                                                <AvatarFallback className="rounded-md">+{order.items.length - 2}</AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold underline text-sm">Ver todos os itens</p>
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Itens do Pedido</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex flex-col gap-4">
                                                    {order.items.map(item => (
                                                        <OrderItemDisplay key={item.id} item={item} />
                                                    ))}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        order.items.map(item => (
                                            <OrderItemDisplay key={item.id} item={item} />
                                        ))
                                    )}
                                </TableCell>
                                <TableCell>{order.totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                                <TableCell>{paymentMethodMap[order.paymentMethod as keyof typeof paymentMethodMap]}</TableCell>
                                <TableCell>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                                <TableCell>
                                    <Select onValueChange={(value) => handleStatusChange(order.id, value)} defaultValue={order.status}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(statusMap).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">
                                Nenhum pedido encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
} 