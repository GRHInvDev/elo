import "server-only"
import type { Prisma, PrismaClient, UserAuditAction } from "@prisma/client"

/** Aceita tanto o client normal quanto um client de transação. */
type DbClient = PrismaClient | Prisma.TransactionClient

/** Diff de campos alterados: { campo: { from, to } }. */
export type FieldDiff = Record<string, { from: unknown; to: unknown }>

/** Serializa de forma estável (chaves ordenadas) para comparar valores complexos
 * sem falsos positivos por ordem de chave. BigInt vira string. */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key: string, val: unknown): unknown => {
    if (typeof val === "bigint") return val.toString()
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>
      return Object.keys(obj)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = obj[k]
          return acc
        }, {})
    }
    return val
  })
}

/** Normaliza um valor para armazenamento no diff (BigInt -> string, undefined -> null). */
function normalizeValue(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString()
  return value ?? null
}

/**
 * Calcula o diff entre dois objetos para os campos informados.
 * Compara por serialização estável (cobre primitivos, arrays e objetos).
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: (keyof T)[],
): FieldDiff {
  const changes: FieldDiff = {}
  for (const field of fields) {
    const from = before[field]
    const to = after[field]
    if (stableStringify(from) !== stableStringify(to)) {
      changes[String(field)] = { from: normalizeValue(from), to: normalizeValue(to) }
    }
  }
  return changes
}

/**
 * Registra uma movimentação no cadastro de um usuário (auditoria).
 *
 * Para ações de edição (sem ser ativar/desativar), só grava se houver mudança
 * efetiva — evita poluir o histórico com saves sem alteração.
 * A gravação nunca deve quebrar a operação principal: erros são engolidos.
 */
export async function recordUserAudit(
  db: DbClient,
  params: {
    userId: string
    changedById: string | null
    action: UserAuditAction
    changes?: FieldDiff | null
  },
): Promise<void> {
  const hasChanges = !!params.changes && Object.keys(params.changes).length > 0
  const isStatusChange =
    params.action === "DEACTIVATED" || params.action === "REACTIVATED"

  if (!isStatusChange && !hasChanges) return

  try {
    await db.userAuditLog.create({
      data: {
        userId: params.userId,
        changedById: params.changedById,
        action: params.action,
        changes: hasChanges
          ? (params.changes as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    })
  } catch (error) {
    // Auditoria é complementar: não deve derrubar a mutation principal.
    console.error("[user-audit] Falha ao registrar movimentação:", error)
  }
}
