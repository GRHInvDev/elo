import { sendEmail } from "@/lib/mail/email-utils";
import { emailPedidosRestauranteAgrupado, type GroupedEmailOrder } from "@/lib/mail/html-mock";
import { db } from "@/server/db";
import { type Restaurant } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("| CRONJOB | Executando envio de pedidos de comida...");
  const processOrders = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log("| CRONJOB | Data de hoje:", today);
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
          optionSelections: {
            include: {
              choice: {
                include: {
                  option: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
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
        const { restaurant, orders: ordersData } = data;
        
        if (ordersData.length > 0) {
          const dataPedidos = today.toLocaleDateString('pt-BR');
          const pedidosAgrupados: GroupedEmailOrder[] = ordersData.map((order, idx) => {
            const fullName = `${order.user.firstName} ${order.user?.lastName ?? ""}`.trim();
            const prato = order.menuItem?.name ?? "";
            // Ordena por nome da opção e depois nome da escolha para garantir consistência
            const opcionais = (order.optionSelections ?? [])
              .slice()
              .sort((a, b) => {
                const optCmp = a.choice.option.name.localeCompare(b.choice.option.name, "pt-BR", { sensitivity: "base" });
                if (optCmp !== 0) return optCmp;
                return a.choice.name.localeCompare(b.choice.name, "pt-BR", { sensitivity: "base" });
              })
              .map((sel) => `${sel.choice.option.name}: ${sel.choice.name}`)
              .filter(Boolean);
            const opc = opcionais.length > 0 ? opcionais.join(", ") : ""; // vazio => "sem adicional"
            return {
              num: idx + 1,
              data: dataPedidos,
              func: fullName,
              prato,
              opc,
              obs: order.observations ?? null,
            };
          });

          const emailContent = emailPedidosRestauranteAgrupado(
            restaurant.name,
            dataPedidos,
            pedidosAgrupados,
          );

          await sendEmail(
            restaurant.email,
            `Pedidos do Dia - ${restaurant.name}`,
            emailContent,
            "rh@boxdistribuidor.com.br, dp@boxdistribuidor.com.br"
          );

          console.log(`| CRONJOB | Email enviado para ${restaurant.name} com ${ordersData.length} pedidos`);
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