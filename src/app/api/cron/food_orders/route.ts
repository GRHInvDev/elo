import { NextResponse } from "next/server"
import { sendFoodOrdersEmail } from "@/server/services/food-order-email"

export async function GET() {
  console.log("| CRONJOB | Envio acionado conforme programado do CronJob: Payload simples")
  const processOrders = async () => {
    try {
      const result = await sendFoodOrdersEmail({})
      console.log(`| CRONJOB | Emails enviados para ${result.restaurantsNotified} restaurantes`)
      if (result.emailsNotified.length > 0) {
        console.log(`| CRONJOB | Email dos Restaurantes enviados:`, result.emailsNotified.join(", "))
      }
      console.log(`| CRONJOB | Processamento de pedidos concluído`)
    } catch (err) {
      console.error("| CRONJOB | Erro ao processar pedidos de comida:", err)
    }
  }

  void processOrders()
  return NextResponse.json({ message: "ok" })
}