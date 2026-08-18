import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { ACCESS_LOG_RETENTION_DAYS } from "@/const/access-log"

/**
 * Limpeza da trilha de acesso: apaga registros fora da janela de retenção.
 *
 * A tabela cresce a cada navegação, então sem esta rota agendada ela vira
 * dívida. O corte usa o índice em createdAt.
 */
export async function GET() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ACCESS_LOG_RETENTION_DAYS)

  try {
    const { count } = await db.accessLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })

    console.log(
      `| CRONJOB | access_logs: ${count} registros anteriores a ${cutoff.toISOString()} removidos`,
    )

    return NextResponse.json({ deleted: count, cutoff: cutoff.toISOString() })
  } catch (error) {
    console.error("| CRONJOB | Erro ao limpar access_logs:", error)
    return NextResponse.json({ error: "falha ao limpar access_logs" }, { status: 500 })
  }
}
