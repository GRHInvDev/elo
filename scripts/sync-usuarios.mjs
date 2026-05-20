/**
 * sync-usuarios.mjs
 *
 * Lê um CSV e sincroniza no banco:
 *  - is_active → S = ativo, N = desativado
 *  - filialId  → código da filial (ex: "CAC") ou vazio = sem filial
 *
 * Uso:
 *   node scripts/sync-usuarios.mjs [caminho-do-csv] [--dry-run]
 *
 * Padrão: scripts/usuarios.csv
 */

import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "@prisma/client"

// Carrega variáveis de ambiente do .env local
process.loadEnvFile(resolve(process.cwd(), ".env"))

const __dirname = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const DRY_RUN = args.includes("--dry-run")
const csvArg = args.find((a) => !a.startsWith("--"))
const CSV_FILE = csvArg
  ? resolve(process.cwd(), csvArg)
  : resolve(__dirname, "usuarios.csv")

const prisma = new PrismaClient({ log: ["error"] })

// ─── parse CSV simples (sem deps externas) ──────────────────────────────────
function parseCSV(content) {
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .split("\n")
    .filter((l) => l.trim())

  if (lines.length < 2) throw new Error("CSV sem linhas de dados")

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

  const required = ["user_id", "ativo", "filial_codigo"]
  for (const col of required) {
    if (!headers.includes(col))
      throw new Error(`Coluna obrigatória ausente no CSV: "${col}"`)
  }

  return lines.slice(1).map((line, i) => {
    const values = line.split(",").map((v) => v.trim())
    const row = Object.fromEntries(headers.map((h, idx) => [h, values[idx] ?? ""]))
    row._linha = i + 2
    return row
  })
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${DRY_RUN ? "🔍 [DRY-RUN] " : ""}Lendo: ${CSV_FILE}`)

  let content
  try {
    content = readFileSync(CSV_FILE, "utf-8")
  } catch {
    console.error(`\n❌ Arquivo não encontrado: ${CSV_FILE}`)
    console.error(
      "   Copie scripts/usuarios-template.csv para scripts/usuarios.csv e preencha.",
    )
    process.exit(1)
  }

  const rows = parseCSV(content)
  console.log(`📋 ${rows.length} linha(s) encontrada(s)\n`)

  // Pré-carrega todas as filiais para evitar N+1
  const filiais = await prisma.filial.findMany()
  const filiaisMap = new Map(filiais.map((f) => [f.code.toUpperCase(), f]))

  if (filiais.length === 0) {
    console.warn("⚠️  Nenhuma filial cadastrada no banco. Crie as filiais antes de rodar este script.")
  } else {
    console.log(
      `🏢 Filiais disponíveis: ${filiais.map((f) => f.code).join(", ")}\n`,
    )
  }

  const resultados = { atualizados: 0, ignorados: 0, erros: [] }

  for (const row of rows) {
    const userId = row.user_id?.trim()
    const ativo = row.ativo?.trim().toUpperCase() === "S"
    const filialCodigo = row.filial_codigo?.trim().toUpperCase() ?? ""
    const linha = row._linha

    if (!userId) {
      resultados.erros.push({ linha, motivo: "user_id vazio" })
      continue
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, filialId: true },
    })

    if (!user) {
      resultados.erros.push({
        linha,
        userId,
        motivo: "Usuário não encontrado no banco",
      })
      continue
    }

    // Resolve o filialId
    let filialId = null
    if (filialCodigo !== "") {
      const filial = filiaisMap.get(filialCodigo)
      if (!filial) {
        resultados.erros.push({
          linha,
          userId,
          motivo: `Código de filial inválido: "${filialCodigo}"`,
        })
        continue
      }
      filialId = filial.id
    }

    const nome = row.nome?.trim() || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
    const statusLabel = ativo ? "✅ ATIVO" : "🚫 DESATIVADO"
    const filialLabel = filialCodigo || "(sem filial)"

    if (DRY_RUN) {
      console.log(`  [simulação] ${nome} (${userId}) → ${statusLabel} | filial: ${filialLabel}`)
      resultados.atualizados++
      continue
    }

    await prisma.user.update({
      where: { id: userId },
      data: { is_active: ativo, filialId },
    })

    console.log(`  ${statusLabel} ${nome} (${userId}) | filial: ${filialLabel}`)
    resultados.atualizados++
  }

  // ─── resumo ────────────────────────────────────────────────────────────────
  console.log("\n────────────────────────────────────────────")
  console.log(`  ${DRY_RUN ? "Seriam atualizados" : "Atualizados"}: ${resultados.atualizados}`)
  if (resultados.erros.length > 0) {
    console.log(`  Erros/ignorados:   ${resultados.erros.length}`)
    console.log("\n  Detalhes dos erros:")
    for (const e of resultados.erros) {
      const loc = e.email ? `${e.email} (linha ${e.linha})` : `linha ${e.linha}`
      console.log(`    ⚠️  ${loc}: ${e.motivo}`)
    }
  }
  console.log("────────────────────────────────────────────\n")

  if (DRY_RUN) {
    console.log("Nenhuma alteração foi salva. Remova --dry-run para aplicar.\n")
  }
}

main()
  .catch((err) => {
    console.error("\n❌ Erro fatal:", err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
