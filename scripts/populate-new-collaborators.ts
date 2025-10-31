/**
 * Script para marcar todos os usuários existentes como colaboradores não novos
 * 
 * Este script marca todos os colaboradores existentes como não novos (isNew = false),
 * pois eles já são usuários antigos do sistema e não devem ver o card de boas-vindas.
 * Apenas novos usuários que acessarem pela primeira vez verão o card.
 * 
 * Execute com: npx tsx scripts/populate-new-collaborators.ts
 * ou
 * pnpm tsx scripts/populate-new-collaborators.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function populateNewCollaborators() {
  try {
    console.log("🔄 Iniciando atualização de status de colaboradores...")

    // Buscar todos os usuários
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })

    console.log(`📊 Encontrados ${allUsers.length} usuários no sistema`)

    let created = 0
    let updated = 0
    let skipped = 0

    // Criar ou atualizar registro para cada usuário
    for (const user of allUsers) {
      const existing = await prisma.newCollaborator.findUnique({
        where: { userId: user.id },
      })

      if (!existing) {
        // Criar registro marcando como não novo (já é colaborador antigo)
        await prisma.newCollaborator.create({
          data: {
            userId: user.id,
            isNew: false, // Colaboradores existentes não são novos
          },
        })
        created++
        console.log(`✅ Criado (não novo): ${user.firstName ?? ""} ${user.lastName ?? ""} (${user.email})`)
      } else if (existing.isNew === true) {
        // Atualizar se estava marcado como novo
        await prisma.newCollaborator.update({
          where: { userId: user.id },
          data: { isNew: false },
        })
        updated++
        console.log(`🔄 Atualizado (não novo): ${user.firstName ?? ""} ${user.lastName ?? ""} (${user.email})`)
      } else {
        // Já estava marcado como não novo
        skipped++
        console.log(`⏭️  Já marcado como não novo: ${user.firstName ?? ""} ${user.lastName ?? ""} (${user.email})`)
      }
    }

    console.log("\n✨ Processo concluído!")
    console.log(`📈 Resumo:`)
    console.log(`   - Criados: ${created}`)
    console.log(`   - Atualizados: ${updated}`)
    console.log(`   - Já estavam corretos: ${skipped}`)
    console.log(`   - Total processado: ${allUsers.length}`)
  } catch (error) {
    console.error("❌ Erro ao atualizar status de colaboradores:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar o script
populateNewCollaborators()
  .then(() => {
    console.log("\n🎉 Script executado com sucesso!")
    console.log("📝 Todos os colaboradores existentes foram marcados como não novos.")
    console.log("🆕 Apenas novos usuários que acessarem pela primeira vez verão o card de boas-vindas.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Erro ao executar script:", error)
    process.exit(1)
  })
