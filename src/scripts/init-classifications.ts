/**
 * Script para inicializar as classificações padrão no banco de dados
 * Execute: npx tsx src/scripts/init-classifications.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Inicializando classificações padrão...')
  
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
  let skipped = 0

  for (const item of defaultClassifications) {
    try {
      const result = await prisma.classification.upsert({
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
      
      if (result) {
        console.log(`✅ ${item.type}: ${item.label} (${item.score} pontos)`)
        created++
      }
    } catch (error) {
      console.log(`⚠️  Erro ao criar ${item.label}: ${error}`)
      skipped++
    }
  }

  console.log(`\n🎉 Concluído!`)
  console.log(`   Criadas/Atualizadas: ${created}`)
  console.log(`   Ignoradas: ${skipped}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
