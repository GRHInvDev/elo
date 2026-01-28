import { NextResponse } from "next/server"
import { sendFoodOrdersEmail } from "@/server/services/food-order-email"

export async function GET() {
  console.log("| CRONJOB | Executando envio de pedidos de comida...")
  const processOrders = async () => {
    try {
      const result = await sendFoodOrdersEmail({})
      console.log(`| CRONJOB | Emails enviados para ${result.restaurantsNotified} restaurantes`)
      console.log(`| CRONJOB | Processamento de pedidos concluído`)
    } catch (err) {
      console.error("| CRONJOB | Erro ao processar pedidos de comida:", err)
    }
  }

  void processOrders()
  return NextResponse.json({ message: "ok" })
}