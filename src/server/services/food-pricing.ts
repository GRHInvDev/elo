import { type PrismaClient } from "@prisma/client"

interface ResolveOrderUnitPriceParams {
  orderDate: Date
  restaurantId?: string | null
  fallbackPrice?: number
}

/**
 * Resolve o preço unitário da refeição para a data do pedido.
 */
export async function resolveOrderUnitPrice(
  db: PrismaClient,
  params: ResolveOrderUnitPriceParams,
): Promise<number> {
  const { orderDate, restaurantId, fallbackPrice } = params

  try {
    const policies = await db.mealPricingPolicy.findMany({
      where: {
        startDate: { lte: orderDate },
        OR: [
          { endDate: null },
          { endDate: { gte: orderDate } },
        ],
      },
      orderBy: [
        { startDate: "desc" },
      ],
    })

    if (policies.length > 0) {
      if (restaurantId) {
        const restaurantPolicy = policies.find((p) => p.restaurantId === restaurantId)
        if (restaurantPolicy) {
          return restaurantPolicy.price
        }
      }

      const globalPolicy = policies.find((p) => !p.restaurantId)
      if (globalPolicy) {
        return globalPolicy.price
      }

      return policies[0]!.price
    }
  } catch (error) {
    console.error("Erro ao resolver preço da refeição pela política de vigência:", error)
  }

  if (typeof fallbackPrice === "number" && !isNaN(fallbackPrice)) {
    return fallbackPrice
  }

  const cutoffSeptember2026 = new Date("2026-09-01T00:00:00.000Z")
  return orderDate < cutoffSeptember2026 ? 4.00 : 7.00
}
