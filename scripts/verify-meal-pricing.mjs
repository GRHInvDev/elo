import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  console.log("=== VERIFICAÇÃO DE POLÍTICAS DE PREÇO ===")
  const policies = await db.mealPricingPolicy.findMany({
    orderBy: { startDate: "asc" },
  })
  console.log(policies)

  console.log("\n=== VERIFICAÇÃO DE PEDIDOS POR PERÍODO E VALOR ===")
  const breakdown = await db.$queryRaw`
    SELECT 
      CASE 
        WHEN "orderDate" < '2026-09-01 00:00:00.000' THEN 'Até 31/08 (R$ 4,00)'
        ELSE 'A partir de 01/09 (R$ 7,00)'
      END AS periodo,
      "unitPrice",
      COUNT(*)::int AS total_pedidos,
      ROUND(SUM("unitPrice")::numeric, 2) AS valor_total
    FROM food_orders
    GROUP BY 1, 2
    ORDER BY 1, 2;
  `
  console.log(breakdown)

  const nullOrdersCount = await db.foodOrder.count({
    where: { unitPrice: null },
  })
  console.log(`\nPedidos com unitPrice nulo: ${nullOrdersCount}`)

  console.log("\n=== PREÇO MÉDIO DOS ITENS DE MENU ===")
  const menuItemsSummary = await db.menuItem.aggregate({
    _avg: { price: true },
    _min: { price: true },
    _max: { price: true },
    _count: true,
  })
  console.log(menuItemsSummary)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
