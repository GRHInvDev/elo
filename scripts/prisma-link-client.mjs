import { createRequire } from "node:module"
import { cp, mkdir, rm, stat, symlink } from "node:fs/promises"
import path from "node:path"

const require = createRequire(import.meta.url)

const prismaClientPackagePath = require.resolve("@prisma/client/package.json")
const prismaClientDir = path.dirname(prismaClientPackagePath)
const generatedPrismaDir = path.resolve(prismaClientDir, "..", "..", ".prisma")
const nestedNodeModulesDir = path.join(prismaClientDir, "node_modules")
const linkPath = path.join(nestedNodeModulesDir, ".prisma")

const generated = await stat(generatedPrismaDir).catch(() => null)
if (!generated?.isDirectory()) {
  console.error(
    `[prisma-link-client] Client gerado nao encontrado em ${generatedPrismaDir}.`,
    "Rode 'prisma generate' antes deste script.",
  )
  process.exit(1)
}

await mkdir(nestedNodeModulesDir, { recursive: true })
await rm(linkPath, { recursive: true, force: true })

/**
 * No Windows, symlink de diretorio exige SeCreateSymbolicLinkPrivilege (Developer
 * Mode ou admin) e falha com EPERM sem ele. Junction nao exige privilegio, mas so
 * aceita caminho absoluto. Nos demais SOs mantemos o symlink relativo.
 */
const strategies =
  process.platform === "win32"
    ? [
        { tipo: "junction", run: () => symlink(generatedPrismaDir, linkPath, "junction") },
        {
          tipo: "symlink",
          run: () => symlink(path.relative(nestedNodeModulesDir, generatedPrismaDir), linkPath, "dir"),
        },
      ]
    : [
        {
          tipo: "symlink",
          run: () => symlink(path.relative(nestedNodeModulesDir, generatedPrismaDir), linkPath, "dir"),
        },
      ]

let criado = null
const falhas = []

for (const { tipo, run } of strategies) {
  try {
    await run()
    criado = tipo
    break
  } catch (e) {
    falhas.push(`${tipo}: ${e.code ?? e.message}`)
    await rm(linkPath, { recursive: true, force: true })
  }
}

// Ultimo recurso: copia o diretorio gerado. Custa disco e exige rodar o script a
// cada 'prisma generate', mas mantem o build funcionando sem privilegio elevado.
if (!criado) {
  try {
    await cp(generatedPrismaDir, linkPath, { recursive: true })
    criado = "copia"
  } catch (e) {
    console.error(
      "[prisma-link-client] Nao foi possivel criar o link nem copiar o client.",
      `Tentativas: ${[...falhas, `copia: ${e.code ?? e.message}`].join(" | ")}.`,
      "No Windows, ative o Modo de Desenvolvedor ou rode o terminal como administrador.",
    )
    process.exit(1)
  }
}

console.log(`[prisma-link-client] ${criado} criado:`, linkPath, "->", generatedPrismaDir)
