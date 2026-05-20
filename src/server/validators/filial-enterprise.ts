import { TRPCError } from "@trpc/server"
import { Enterprise } from "@prisma/client"
import type { PrismaClient } from "@prisma/client"

export function enterpriseRequiresFilial(enterprise: Enterprise): boolean {
  return enterprise === Enterprise.Box_Filial || enterprise === Enterprise.Cristallux_Filial
}

/**
 * Garante que filialId só exista quando a empresa é do tipo Filial e que a filial pertence à mesma empresa.
 */
export async function ensureFilialConsistentWithEnterprise(
  db: PrismaClient,
  params: { filialId: string | null; enterprise: Enterprise },
): Promise<void> {
  const { filialId, enterprise } = params

  if (!enterpriseRequiresFilial(enterprise)) {
    if (filialId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Filial só pode ser informada para empresas do tipo Filial (Box Filial ou Cristallux Filial).",
      })
    }
    return
  }

  if (!filialId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Filial é obrigatória para esta empresa.",
    })
  }

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

  if (filial.empresa.enterprise !== enterprise) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A filial selecionada não pertence à empresa do colaborador. Ajuste a empresa ou escolha outra filial.",
    })
  }
}
