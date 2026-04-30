import { createRequire } from "node:module"
import { mkdir, rm, symlink } from "node:fs/promises"
import path from "node:path"

const require = createRequire(import.meta.url)

const prismaClientPackagePath = require.resolve("@prisma/client/package.json")
const prismaClientDir = path.dirname(prismaClientPackagePath)
const generatedPrismaDir = path.resolve(prismaClientDir, "..", "..", ".prisma")
const nestedNodeModulesDir = path.join(prismaClientDir, "node_modules")
const linkPath = path.join(nestedNodeModulesDir, ".prisma")

await mkdir(nestedNodeModulesDir, { recursive: true })
await rm(linkPath, { recursive: true, force: true })
await symlink(path.relative(nestedNodeModulesDir, generatedPrismaDir), linkPath, "dir")

console.log("[prisma-link-client] Link criado:", linkPath, "->", generatedPrismaDir)

