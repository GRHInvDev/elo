import { emailPedidosRestauranteAgrupado, type GroupedEmailOrder } from "@/lib/mail/html-mock"
import { sendEmail } from "@/lib/mail/email-utils"
import { db } from "@/server/db"
import { type Restaurant } from "@prisma/client"

const FOOD_ORDERS_CC_LIST = "rh@boxdistribuidor.com.br, dp@boxdistribuidor.com.br, rh01@boxdistribuidor.com.br, recursoshumanos@boxdistribuidor.com.br"

interface SendFoodOrdersEmailParams {
  restaurantId?: string
  orderDate?: Date
}

interface SendFoodOrdersEmailResult {
  restaurantsNotified: number
  ordersNotified: number
  emailsNotified: string[]
}

const normalizeOrderDate = (orderDate: Date): Date => {
  return new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate(), 0, 0, 0, 0)
}

/**
 * Envia emails de pedidos de comida agrupados por restaurante.
 * Se restaurantId for informado, envia apenas para aquele restaurante.
 */
export const sendFoodOrdersEmail = async ({
  restaurantId,
  orderDate,
}: SendFoodOrdersEmailParams): Promise<SendFoodOrdersEmailResult> => {
  const targetDate = normalizeOrderDate(orderDate ?? new Date())

  const orders = await db.foodOrder.findMany({
    where: {
      orderDate: targetDate,
      status: "PENDING",
      ...(restaurantId ? { restaurantId } : {}),
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
  })

  const ordersWithRestaurant = orders.filter(
    (order): order is typeof order & { restaurantId: string; restaurant: Restaurant } => {
      return order.restaurantId !== null && order.restaurant !== null
    },
  )

  const ordersByRestaurant = new Map<string, { restaurant: Restaurant; orders: typeof orders }>()
  ordersWithRestaurant.forEach((order) => {
    const currentRestaurantId = order.restaurantId
    if (!ordersByRestaurant.has(currentRestaurantId)) {
      ordersByRestaurant.set(currentRestaurantId, {
        restaurant: order.restaurant,
        orders: [] as typeof orders,
      })
    }
    ordersByRestaurant.get(currentRestaurantId)?.orders.push(order)
  })

  let restaurantsNotified = 0
  let ordersNotified = 0
  const emailsNotified: string[] = []

  for (const [, data] of ordersByRestaurant) {
    const { restaurant, orders: ordersData } = data

    if (!restaurant.email || ordersData.length === 0) {
      continue
    }

    const dataPedidos = targetDate.toLocaleDateString("pt-BR")
    const pedidosAgrupados: GroupedEmailOrder[] = ordersData.map((order, idx) => {
      const fullName = `${order.user.firstName} ${order.user?.lastName ?? ""}`.trim()
      const prato = order.menuItem?.name ?? ""
      const opcionais = (order.optionSelections ?? [])
        .slice()
        .sort((a, b) => {
          const optCmp = a.choice.option.name.localeCompare(b.choice.option.name, "pt-BR", { sensitivity: "base" })
          if (optCmp !== 0) return optCmp
          return a.choice.name.localeCompare(b.choice.name, "pt-BR", { sensitivity: "base" })
        })
        .map((sel) => `${sel.choice.option.name}: ${sel.choice.name}`)
        .filter(Boolean)
      const opc = opcionais.length > 0 ? opcionais.join(", ") : ""
      return {
        num: idx + 1,
        data: dataPedidos,
        func: fullName,
        prato,
        opc,
        obs: order.observations ?? null,
      }
    })

    const emailContent = emailPedidosRestauranteAgrupado(
      restaurant.name,
      dataPedidos,
      pedidosAgrupados,
    )

    await sendEmail(
      restaurant.email,
      `Pedidos do Dia - ${restaurant.name}`,
      emailContent,
      FOOD_ORDERS_CC_LIST,
    )

    restaurantsNotified += 1
    ordersNotified += ordersData.length
    emailsNotified.push(restaurant.email)
  }

  return { restaurantsNotified, ordersNotified, emailsNotified }
}
