import "server-only";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { RolesConfig } from "@/types/role-config";
import {
  createQualityDocumentSchema,
  updateQualityDocumentSchema,
  qualityDocumentIdSchema,
  listQualityDocumentsSchema,
} from "@/schemas/quality-document.schema";
import { type Prisma } from "@prisma/client";

// Função auxiliar para verificar permissão
function checkQualityManagementPermission(roleConfig: RolesConfig | null | undefined): void {
  if (!roleConfig) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para gerenciar documentos de qualidade",
    });
  }

  if (roleConfig.sudo) return;

  if (roleConfig.can_manage_quality_management !== true) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para gerenciar documentos de qualidade",
    });
  }
}

export const qualityDocumentRouter = createTRPCRouter({
  // LISTAR DOCUMENTOS
  list: protectedProcedure
    .input(listQualityDocumentsSchema)
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50;
      const {
        cursor,
        enterprise,
        setor,
        docLastEditFrom,
        docLastEditTo,
        docResponsibleId,
        search,
        searchColumn,
      } = input;

      // Construção de filtros
      const andFilters: Prisma.QualityDocumentWhereInput[] = [];
      const orFilters: Prisma.QualityDocumentWhereInput[] = [];
      
      // Empresa / Setor (OR entre usuários responsáveis e aprovadores)
      if (enterprise) {
        orFilters.push(
          { docResponsible: { enterprise } },
          { docApprovedManager: { enterprise } }
        );
      }

      if (setor) {
        orFilters.push(
          { docResponsible: { setor } },
          { docApprovedManager: { setor } }
        );
      }

      if (orFilters.length > 0) {
        andFilters.push({ OR: orFilters });
      }

      // Responsável
      if (docResponsibleId) {
        andFilters.push({ docResponsibleId });
      }

      // Filtro por data
      if (docLastEditFrom || docLastEditTo) {
        const dateFilter: Prisma.DateTimeFilter = {
          gte: docLastEditFrom,
          lte: docLastEditTo,
        };
        if (docLastEditFrom) dateFilter.gte = docLastEditFrom;
        if (docLastEditTo) dateFilter.lte = docLastEditTo;

        andFilters.push({ docLastEdit: dateFilter });
      }

      // Busca por texto
      if (search) {
        if (searchColumn) {
          // Busca em coluna específica
          andFilters.push({
            [searchColumn]: {
              contains: search,
              mode: "insensitive",
            },
          });
        } else {
          // Busca em múltiplas colunas
          andFilters.push({
            OR: [
              { docName: { contains: search, mode: "insensitive" } },
              { docDesc: { contains: search, mode: "insensitive" } },
              { docProcess: { contains: search, mode: "insensitive" } },
              { docCod: { contains: search, mode: "insensitive" } },
              { docTypeArc: { contains: search, mode: "insensitive" } },
              { docAvailability: { contains: search, mode: "insensitive" } },
            ],
          });
        }
      }

      // Montagem final do WHERE
      const where = andFilters.length > 0 ? { AND: andFilters } : {};

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
      });

      let nextCursor: string | undefined = undefined;
      if (documents.length > limit) {
        const nextItem = documents.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: documents,
        nextCursor,
      };
    }),

  // BUSCAR POR ID
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
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado",
        });
      }

      return document;
    }),

  // CRIAR DOCUMENTO
  create: protectedProcedure
    .input(createQualityDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });

      const roleConfig = currentUser?.role_config as RolesConfig | null;
      checkQualityManagementPermission(roleConfig);

      const existingDoc = await ctx.db.qualityDocument.findFirst({
        where: { docCod: input.docCod },
      });

      if (existingDoc) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um documento com este código",
        });
      }

      const document = await ctx.db.qualityDocument.create({
        data: {
          docName: input.docName,
          docDesc: input.docDesc,
          docURL: !!input.docURL ? input.docURL : null,
          docLink: !!input.docLink ? input.docLink : null,
          docProcess: input.docProcess,
          docCod: input.docCod,
          docLastEdit: input.docLastEdit,
          docTypeArc: input.docTypeArc,
          docResponsibleId: !!input.docResponsibleId ? input.docResponsibleId : null,
          docApprovedManagerId: !!input.docApprovedManagerId ? input.docApprovedManagerId : null,
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
      });

      return document;
    }),

  // ATUALIZAR DOCUMENTO
  update: protectedProcedure
    .input(updateQualityDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });

      const roleConfig = currentUser?.role_config as RolesConfig | null;
      checkQualityManagementPermission(roleConfig);

      const { id, ...data } = input;

      if (data.docCod) {
        const existingDoc = await ctx.db.qualityDocument.findFirst({
          where: {
            docCod: data.docCod,
            id: { not: id },
          },
        });

        if (existingDoc) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe outro documento com este código",
          });
        }
      }

      const document = await ctx.db.qualityDocument.update({
        where: { id },
        data: {
          ...data,
          docURL: data.docURL ?? null,
          docLink: data.docLink ?? null,
          docResponsibleId: data.docResponsibleId ?? null,
          docApprovedManagerId: data.docApprovedManagerId ?? null,
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
      });

      return document;
    }),

  // DELETAR DOCUMENTO
  delete: protectedProcedure
    .input(qualityDocumentIdSchema)
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });

      const roleConfig = currentUser?.role_config as RolesConfig | null;
      checkQualityManagementPermission(roleConfig);

      await ctx.db.qualityDocument.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
