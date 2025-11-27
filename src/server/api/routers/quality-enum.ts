import "server-only";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import type { RolesConfig } from "@/types/role-config";
import { type Prisma } from "@prisma/client";

// Função auxiliar para verificar permissão
function checkQualityManagementPermission(roleConfig: RolesConfig | null | undefined): void {
  if (!roleConfig) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  if (roleConfig.sudo) return;

  if (roleConfig.can_manage_quality_management !== true) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para gerenciar documentos de qualidade",
    });
  }
}

export const qualityEnumRouter = createTRPCRouter({
  // LISTAR ENUMS
  list: protectedProcedure
    .input(z.object({
      type: z.enum(["PROCESS", "FILE_TYPE", "DEPARTMENT", "ENTERPRISE"]).optional(),
      active: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.QualityEnumWhereInput = {};
      if (input.type) where.type = input.type;
      if (input.active !== undefined) where.active = input.active;

      return await ctx.db.qualityEnum.findMany({
        where,
        orderBy: { name: "asc" },
      });
    }),

  // CRIAR ENUM
  create: protectedProcedure
    .input(z.object({
      type: z.enum(["PROCESS", "FILE_TYPE", "DEPARTMENT", "ENTERPRISE"]),
      name: z.string().min(1, "Nome é obrigatório"),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });
      const roleConfig = currentUser?.role_config as RolesConfig | null;
      checkQualityManagementPermission(roleConfig);

      return await ctx.db.qualityEnum.create({
        data: {
          type: input.type,
          name: input.name,
          description: input.description,
        },
      });
    }),

  // ATUALIZAR ENUM
  update: protectedProcedure
    .input(z.object({
      id: z.string().cuid("ID inválido"),
      name: z.string().min(1, "Nome é obrigatório").optional(),
      description: z.string().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });
      const roleConfig = currentUser?.role_config as RolesConfig | null;
      checkQualityManagementPermission(roleConfig);

      const { id, ...data } = input;
      return await ctx.db.qualityEnum.update({
        where: { id },
        data,
      });
    }),

  // DELETAR ENUM
  delete: protectedProcedure
    .input(z.object({
      id: z.string().cuid("ID inválido"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });
      const roleConfig = currentUser?.role_config as RolesConfig | null;
      checkQualityManagementPermission(roleConfig);

      await ctx.db.qualityEnum.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
