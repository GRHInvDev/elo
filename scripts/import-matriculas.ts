// /**
//  * Script para importar matrículas de usuários a partir do arquivo CSV
//  * 
//  * Este script lê o arquivo "Usuarios Intranet.csv" e atualiza o campo
//  * matricula de cada usuário conforme o userId correspondente.
//  * 
//  * Execute com: npx tsx scripts/import-matriculas.ts
//  * ou
//  * pnpm tsx scripts/import-matriculas.ts
//  */

// import { PrismaClient } from "@prisma/client"
// import { readFileSync } from "fs"
// import { join } from "path"

// const prisma = new PrismaClient()

// interface CsvRow {
//   userId: string
//   matricula: string | null
// }

// /**
//  * Lê e parseia o arquivo CSV
//  */
// function parseCsv(filePath: string): CsvRow[] {
//   try {
//     const fileContent = readFileSync(filePath, "utf-8")
//     const lines = fileContent.split("\n").filter((line) => line.trim() !== "")
    
//     // Pular o cabeçalho
//     const dataLines = lines.slice(1)
    
//     const rows: CsvRow[] = []
    
//     for (const line of dataLines) {
//       // Ignorar linhas vazias ou que começam com ;
//       if (!line.trim() || line.trim().startsWith(";")) {
//         continue
//       }
      
//       const parts = line.split(";")
//       const userId = parts[0]?.trim()
//       const matricula = parts[1]?.trim() || null
      
//       // Ignorar linhas sem userId
//       if (!userId) {
//         continue
//       }
      
//       rows.push({
//         userId,
//         matricula: matricula && matricula !== "" ? matricula : null,
//       })
//     }
    
//     return rows
//   } catch (error) {
//     console.error("❌ Erro ao ler arquivo CSV:", error)
//     throw error
//   }
// }

// /**
//  * Função principal para importar matrículas
//  */
// async function importMatriculas() {
//   try {
//     console.log("🔄 Iniciando importação de matrículas...")
    
//     // Caminho do arquivo CSV
//     const csvPath = join("./usuarios-intranet.csv")
//     console.log(`📁 Lendo arquivo: ${csvPath}`)
    
//     // Parsear CSV
//     const rows = parseCsv(csvPath)
//     console.log(`📊 Encontradas ${rows.length} linhas no CSV`)
    
//     let updated = 0
//     let notFound = 0
//     let skipped = 0
//     let errors = 0
    
//     // Processar cada linha
//     for (const row of rows) {
//       try {
//         // Verificar se usuário existe
//         const user = await prisma.user.findUnique({
//           where: { id: row.userId },
//           select: { id: true, email: true, matricula: true },
//         })
        
//         if (!user) {
//           console.warn(`⚠️  Usuário não encontrado: ${row.userId}`)
//           notFound++
//           continue
//         }
        
//         // Se a matrícula estiver vazia/null no CSV, pular (não atualizar)
//         if (row.matricula === null) {
//           skipped++
//           continue
//         }
        
//         // Atualizar matrícula
//         await prisma.user.update({
//           where: { id: row.userId },
//           data: { matricula: row.matricula },
//         })
        
//         updated++
//       } catch (error) {
//         console.error(`❌ Erro ao processar usuário ${row.userId}:`, error)
//         errors++
//       }
//     }
    
//     // Resumo
//     console.log("\n" + "=".repeat(50))
//     console.log("📈 Resumo da importação:")
//     console.log(`   ✅ Atualizados: ${updated}`)
//     console.log(`   ⏭️  Ignorados (sem matrícula): ${skipped}`)
//     console.log(`   ❌ Usuários não encontrados: ${notFound}`)
//     console.log(`   🔴 Erros: ${errors}`)
//     console.log("=".repeat(50))
    
//     console.log("\n✨ Importação concluída!")
//   } catch (error) {
//     console.error("❌ Erro fatal durante importação:", error)
//     throw error
//   } finally {
//     await prisma.$disconnect()
//   }
// }

// // Executar script
// importMatriculas()
//   .catch((error) => {
//     console.error(error)
//     process.exit(1)
//   })

