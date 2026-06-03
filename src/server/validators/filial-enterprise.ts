import { TRPCError } from "@trpc/server"
import type { Enterprise, PrismaClient } from "@prisma/client"

/**
 * Modelo novo de vínculo: o usuário é ligado a uma Filial (filialId) e a Empresa
 * é derivada de `filial.empresa`. O enum legado `enterprise` é mantido em sincronia
 * com `empresa.enterprise` para compatibilidade com relatórios/exportações antigas.
 *
 * Dada uma filial, retorna o enum `enterprise` da empresa dona dela.
 */
export async function resolveEnterpriseFromFilial(
  db: PrismaClient,
  filialId: string,
): Promise<Enterprise> {
  const filial = await db.filial.findUnique({
    where: { id: filialId },
    select: { empresa: { select: { enterprise: true } } },
  })

  if (!filial) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Filial não encontrada.",
    })
  }

  return filial.empresa.enterprise
}
