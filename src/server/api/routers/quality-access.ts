import "server-only";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import type { RolesConfig } from "@/types/role-config";

// Função auxiliar para verificar permissão
function checkQualityManagementPermission(roleConfig: RolesConfig | null) {
  if (!roleConfig) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  if (roleConfig.sudo) return;
  if (roleConfig.can_manage_quality_management !== true) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para gerenciar acesso aos documentos",
    });
  }
}

export const qualityAccessRouter = createTRPCRouter({
  // LISTAR ACESSOS DE UM DOCUMENTO
  listByDocument: protectedProcedure
    .input(z.object({
      documentId: z.string().cuid("ID do documento inválido"),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.qualityDocumentAccess.findMany({
        where: { documentId: input.documentId },
        include: {
          user: {
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
        orderBy: { createdAt: "desc" },
      });
    }),

  // CONCEDER ACESSO
  grantAccess: protectedProcedure
    .input(z.object({
      documentId: z.string().cuid("ID do documento inválido"),
      userId: z.string().cuid("ID do usuário inválido"),
      canView: z.boolean().default(true),
      canEdit: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });
      const roleConfig = currentUser?.role_config as RolesConfig | null;
      checkQualityManagementPermission(roleConfig);

      return await ctx.db.qualityDocumentAccess.upsert({
        where: {
          documentId_userId: {
            documentId: input.documentId,
            userId: input.userId,
          },
        },
        update: {
          canView: input.canView,
          canEdit: input.canEdit,
        },
        create: {
          documentId: input.documentId,
          userId: input.userId,
          canView: input.canView,
          canEdit: input.canEdit,
        },
      });
    }),

  // REVOGAR ACESSO
  revokeAccess: protectedProcedure
    .input(z.object({
      documentId: z.string().cuid("ID do documento inválido"),
      userId: z.string().cuid("ID do usuário inválido"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });
      const roleConfig = currentUser?.role_config as RolesConfig | null;
      checkQualityManagementPermission(roleConfig);

      await ctx.db.qualityDocumentAccess.delete({
        where: {
          documentId_userId: {
            documentId: input.documentId,
            userId: input.userId,
          },
        },
      });

      return { success: true };
    }),

  // VERIFICAR ACESSO DO USUÁRIO ATUAL
  checkAccess: protectedProcedure
    .input(z.object({
      documentId: z.string().cuid("ID do documento inválido"),
    }))
    .query(async ({ ctx, input }) => {
      const access = await ctx.db.qualityDocumentAccess.findUnique({
        where: {
          documentId_userId: {
            documentId: input.documentId,
            userId: ctx.auth.userId,
          },
        },
      });

      return {
        canView: access?.canView ?? false,
        canEdit: access?.canEdit ?? false,
      };
    }),
});
