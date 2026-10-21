import { spawnSync } from "node:child_process"

/**
 * Aplica as migrations do Prisma durante o build do deploy.
 *
 * Roda SOMENTE quando VERCEL_ENV === "production". Deploy de preview e build
 * local apenas registram que pularam a etapa: preview e producao podem apontar
 * para a mesma DATABASE_URL, e nesse caso migrar no preview alteraria o schema
 * de producao sem ninguem pedir.
 *
 * Interruptores (sempre nomes de variaveis, nunca valores):
 * - RUN_DB_MIGRATE=false  desliga a etapa, inclusive em producao
 * - RUN_DB_MIGRATE=true   liga a etapa em qualquer ambiente (use com cuidado)
 * - MIGRATE_DATABASE_URL  conexao usada apenas pela migration. No Neon, aponte
 *   para a URL direta (unpooled): o pooler nao sustenta os locks do migrate.
 */

const PREFIX = "[deploy-migrate]"

const vercelEnv = process.env.VERCEL_ENV ?? "local"
const override = process.env.RUN_DB_MIGRATE

const shouldMigrate =
  override === "true"
    ? true
    : override === "false"
      ? false
      : vercelEnv === "production"

if (!shouldMigrate) {
  const motivo =
    override === "false"
      ? "RUN_DB_MIGRATE=false"
      : `ambiente "${vercelEnv}" (a etapa roda somente em producao)`
  console.log(`${PREFIX} migrations nao aplicadas: ${motivo}.`)
  process.exit(0)
}

const urlVarName = process.env.MIGRATE_DATABASE_URL
  ? "MIGRATE_DATABASE_URL"
  : "DATABASE_URL"

if (!process.env[urlVarName]) {
  console.error(
    `${PREFIX} ${urlVarName} nao esta definida no ambiente "${vercelEnv}".`,
    "Build interrompido: publicar o codigo sem aplicar as migrations deixaria o banco atrasado em relacao ao schema.",
  )
  process.exit(1)
}

console.log(
  `${PREFIX} ambiente "${vercelEnv}": aplicando migrations usando ${urlVarName}.`,
)

const result = spawnSync("npm", ["run", "db:migrate"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: process.env[urlVarName] },
})

if (result.error) {
  console.error(`${PREFIX} falha ao executar 'npm run db:migrate':`, result.error.message)
  process.exit(1)
}

if (result.status !== 0) {
  console.error(
    `${PREFIX} 'prisma migrate deploy' terminou com codigo ${result.status}.`,
    "Build interrompido de proposito, para nao publicar codigo sem o schema correspondente.",
  )
  process.exit(result.status ?? 1)
}

console.log(`${PREFIX} migrations aplicadas com sucesso.`)
