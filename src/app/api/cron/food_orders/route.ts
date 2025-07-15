import { sendEmail } from "@/lib/mail/email-utils";
import { mockEmailPedidosRestaurante } from "@/lib/mail/html-mock";
import { db } from "@/server/db";
import { type Restaurant } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("| CRONJOB | Executando envio de pedidos de comida...");
  const processOrders = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar todos os pedidos de hoje
      const orders = await db.foodOrder.findMany({
        where: {
          orderDate: today,
          status: "PENDING",
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          restaurant: true,
          menuItem: true,
        },
      });

      // Agrupar pedidos por restaurante
      const ordersByRestaurant = new Map<string, { restaurant: Restaurant; orders: typeof orders }>();
      orders.forEach((order) => {
        const restaurantId = order.restaurantId;
        if (!ordersByRestaurant.has(restaurantId)) {
          ordersByRestaurant.set(restaurantId, {
            restaurant: order.restaurant,
            orders: [] as typeof orders,
          });
        }
        ordersByRestaurant.get(restaurantId)?.orders.push(order);
      });

      // Enviar email para cada restaurante
      for (const [, data] of ordersByRestaurant) {
        const { restaurant, orders } = data;
        
        if (orders.length > 0) {
          const pedidos = orders.map((order) => ({
            nomeUsuario: `${order.user.firstName} ${order.user?.lastName}`.trim(),
            prato: order.menuItem?.name,
            preco: order.menuItem?.price,
            observacoes: order.observations,
          }));

          const emailContent = mockEmailPedidosRestaurante(
            restaurant.name,
            today.toLocaleDateString('pt-BR'),
            pedidos as {
              nomeUsuario: string;
              prato: string;
              preco: number;
              observacoes: string | null;
            }[]
          );

          await sendEmail(
            restaurant.email,
            `Pedidos do Dia - ${restaurant.name}`,
            emailContent
          );

          console.log(`| CRONJOB | Email enviado para ${restaurant.name} com ${orders.length} pedidos`);
        }
      }

      console.log(`| CRONJOB | Processamento de pedidos concluído`);
    } catch (err) {
      console.error("| CRONJOB | Erro ao processar pedidos de comida:", err);
    }
  };
  
  void processOrders();
  return NextResponse.json({ message: "ok"});
}