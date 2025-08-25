import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/server/db"

export async function POST() {
  try {
    // Verificar se o usuário é admin
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado - Admin necessário" }, { status: 403 })
    }

    // Classificações padrão
    const defaultClassifications = [
      // Impacto
      { label: "Alto impacto", score: 5, type: "IMPACT" as const, order: 1 },
      { label: "Médio impacto", score: 3, type: "IMPACT" as const, order: 2 },
      { label: "Baixo impacto", score: 1, type: "IMPACT" as const, order: 3 },
      
      // Capacidade
      { label: "Alta capacidade", score: 5, type: "CAPACITY" as const, order: 1 },
      { label: "Média capacidade", score: 3, type: "CAPACITY" as const, order: 2 },
      { label: "Baixa capacidade", score: 1, type: "CAPACITY" as const, order: 3 },
      
      // Esforço
      { label: "Baixo esforço", score: 1, type: "EFFORT" as const, order: 1 },
      { label: "Médio esforço", score: 3, type: "EFFORT" as const, order: 2 },
      { label: "Alto esforço", score: 5, type: "EFFORT" as const, order: 3 },
    ]

    let created = 0
    const results = []

    for (const item of defaultClassifications) {
      try {
        const result = await db.classification.upsert({
          where: {
            label_type: {
              label: item.label,
              type: item.type
            }
          },
          update: {
            score: item.score,
            order: item.order,
            isActive: true
          },
          create: item
        })
        
        results.push(result)
        created++
      } catch (error) {
        console.error(`Erro ao criar classificação ${item.label}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${created} classificações inicializadas com sucesso`,
      created,
      total: defaultClassifications.length
    })

  } catch (error) {
    console.error("Erro ao inicializar classificações:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
