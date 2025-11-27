import "server-only";
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import type { RolesConfig } from "@/types/role-config"
import {
  createQualityDocumentSchema,
  updateQualityDocumentSchema,
  qualityDocumentIdSchema,
  listQualityDocumentsSchema,
} from "@/schemas/quality-document.schema"

// Função auxiliar para verificar permissão
function checkQualityManagementPermission(roleConfig: RolesConfig | null | undefined): void {
  if (!roleConfig) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para gerenciar documentos de qualidade",
    })
  }

  if (roleConfig.sudo) {
    return // Sudo tem acesso total
  }

  if (roleConfig.can_manage_quality_management !== true) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para gerenciar documentos de qualidade",
    })
  }
}

export const qualityDocumentRouter = createTRPCRouter({
  // Listar documentos com filtros e busca
  list: protectedProcedure
    .input(listQualityDocumentsSchema)
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50
      const { cursor, enterprise, setor, docLastEditFrom, docLastEditTo, docResponsibleId, search, searchColumn } = input

      // Construir filtros
      const where: any = {}
      const orConditions: any[] = []

      // Filtro por empresa (via usuário responsável ou aprovador)
      if (enterprise) {
        orConditions.push(
          {
            docResponsible: {
              enterprise: enterprise,
            },
          },
          {
            docApprovedManager: {
              enterprise: enterprise,
            },
          },
        )
      }

      // Filtro por setor (via usuário responsável ou aprovador)
      if (setor) {
        orConditions.push(
          {
            docResponsible: {
              setor: setor,
            },
          },
          {
            docApprovedManager: {
              setor: setor,
            },
          },
        )
      }

      if (orConditions.length > 0) {
        where.OR = orConditions
      }

      // Filtro por responsável
      if (docResponsibleId) {
        where.docResponsibleId = docResponsibleId
      }

      // Filtro por data da última revisão
      if (docLastEditFrom || docLastEditTo) {
        where.docLastEdit = {}
        if (docLastEditFrom) {
          where.docLastEdit.gte = docLastEditFrom
        }
        if (docLastEditTo) {
          where.docLastEdit.lte = docLastEditTo
        }
      }

      // Busca por texto
      if (search) {
        if (searchColumn) {
          // Busca em coluna específica
          where[searchColumn] = {
            contains: search,
            mode: "insensitive",
          }
        } else {
          // Busca em múltiplas colunas - combinar com filtros existentes usando AND
          const searchConditions = [
            { docName: { contains: search, mode: "insensitive" } },
            { docDesc: { contains: search, mode: "insensitive" } },
            { docProcess: { contains: search, mode: "insensitive" } },
            { docCod: { contains: search, mode: "insensitive" } },
            { docTypeArc: { contains: search, mode: "insensitive" } },
            { docAvailability: { contains: search, mode: "insensitive" } },
          ]

          // Se já temos filtros OR, precisamos combinar com AND
          if (orConditions.length > 0 || Object.keys(where).length > 0) {
            where.AND = [
              ...(orConditions.length > 0 ? [{ OR: orConditions }] : []),
              { OR: searchConditions },
            ]
            // Remover OR do nível superior se foi movido para AND
            if (where.OR) {
              delete where.OR
            }
          } else {
            where.OR = searchConditions
          }
        }
      }

      const documents = await ctx.db.qualityDocument.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          docResponsible: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              enterprise: true,
              setor: true,
            },
          },
          docApprovedManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              enterprise: true,
              setor: true,
            },
          },
        },
      })

      let nextCursor: string | undefined = undefined
      if (documents.length > limit) {
        const nextItem = documents.pop()
        nextCursor = nextItem?.id
      }

      return {
        items: documents,
        nextCursor,
      }
    }),

  // Buscar documento por ID
  getById: protectedProcedure
    .input(qualityDocumentIdSchema)
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.qualityDocument.findUnique({
        where: { id: input.id },
        include: {
          docResponsible: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              enterprise: true,
              setor: true,
            },
          },
          docApprovedManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              enterprise: true,
              setor: true,
            },
          },
        },
      })

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado",
        })
      }

      return document
    }),

  // Criar documento
  create: protectedProcedure
    .input(createQualityDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null
      checkQualityManagementPermission(roleConfig)

      // Verificar se código já existe
      const existingDoc = await ctx.db.qualityDocument.findFirst({
        where: { docCod: input.docCod },
      })

      if (existingDoc) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um documento com este código",
        })
      }

      const document = await ctx.db.qualityDocument.create({
        data: {
          docName: input.docName,
          docDesc: input.docDesc,
          docURL: input.docURL || null,
          docLink: input.docLink || null,
          docProcess: input.docProcess,
          docCod: input.docCod,
          docLastEdit: input.docLastEdit,
          docTypeArc: input.docTypeArc,
          docResponsibleId: input.docResponsibleId || null,
          docApprovedManagerId: input.docApprovedManagerId || null,
          docRevPeriod: input.docRevPeriod,
          docAvailability: input.docAvailability,
        },
        include: {
          docResponsible: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              enterprise: true,
              setor: true,
            },
          },
          docApprovedManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              enterprise: true,
              setor: true,
            },
          },
        },
      })

      return document
    }),

  // Atualizar documento
  update: protectedProcedure
    .input(updateQualityDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null
      checkQualityManagementPermission(roleConfig)

      const { id, ...data } = input

      // Verificar se código já existe em outro documento
      if (data.docCod) {
        const existingDoc = await ctx.db.qualityDocument.findFirst({
          where: {
            docCod: data.docCod,
            id: { not: id },
          },
        })

        if (existingDoc) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe outro documento com este código",
          })
        }
      }

      const document = await ctx.db.qualityDocument.update({
        where: { id },
        data: {
          ...data,
          docURL: data.docURL || null,
          docLink: data.docLink || null,
          docResponsibleId: data.docResponsibleId || null,
          docApprovedManagerId: data.docApprovedManagerId || null,
        },
        include: {
          docResponsible: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              enterprise: true,
              setor: true,
            },
          },
          docApprovedManager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              enterprise: true,
              setor: true,
            },
          },
        },
      })

      return document
    }),

  // Deletar documento
  delete: protectedProcedure
    .input(qualityDocumentIdSchema)
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })

      const roleConfig = currentUser?.role_config as RolesConfig | null
      checkQualityManagementPermission(roleConfig)

      await ctx.db.qualityDocument.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})

