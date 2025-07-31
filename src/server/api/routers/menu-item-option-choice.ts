import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createMenuItemOptionChoiceSchema, updateMenuItemOptionChoiceSchema, menuItemOptionChoiceIdSchema } from "@/schemas/menu-item-option-choice.schema"

export const menuItemOptionChoiceRouter = createTRPCRouter({
  // Criar uma nova escolha
  create: protectedProcedure
    .input(createMenuItemOptionChoiceSchema)
    .mutation(async ({ ctx, input }) => {
      // Verificar se a opção existe
      const option = await ctx.db.menuItemOption.findUnique({
        where: { id: input.optionId },
      })

      if (!option) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Opção não encontrada",
        })
      }

      return ctx.db.menuItemOptionChoice.create({
        data: input,
        include: {
          option: true,
        },
      })
    }),

  // Atualizar uma escolha
  update: protectedProcedure
    .input(updateMenuItemOptionChoiceSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.menuItemOptionChoice.update({
        where: { id },
        data,
        include: {
          option: true,
        },
      })
    }),

  // Deletar uma escolha
  delete: protectedProcedure
    .input(menuItemOptionChoiceIdSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.menuItemOptionChoice.delete({
        where: { id: input.id },
      })
    }),

  // Buscar uma escolha específica
  byId: protectedProcedure
    .input(menuItemOptionChoiceIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.db.menuItemOptionChoice.findUnique({
        where: { id: input.id },
        include: {
          option: true,
        },
      })
    }),

  // Listar escolhas por opção
  byOption: protectedProcedure
    .input(z.object({ optionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.menuItemOptionChoice.findMany({
        where: {
          optionId: input.optionId,
          available: true,
        },
        include: {
          option: true,
        },
        orderBy: { name: "asc" },
      })
    }),
}) 