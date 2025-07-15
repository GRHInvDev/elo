import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { createMenuItemOptionSchema, updateMenuItemOptionSchema, menuItemOptionIdSchema } from "@/schemas/menu-item-option.schema"

export const menuItemOptionRouter = createTRPCRouter({
  // Criar uma nova opção
  create: protectedProcedure
    .input(createMenuItemOptionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verificar se o item do menu existe
      const menuItem = await ctx.db.menuItem.findUnique({
        where: { id: input.menuItemId },
      })

      if (!menuItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item do menu não encontrado",
        })
      }

      return ctx.db.menuItemOption.create({
        data: input,
        include: {
          choices: {
            where: { available: true },
            orderBy: { name: "asc" },
          },
        },
      })
    }),

  // Atualizar uma opção
  update: protectedProcedure
    .input(updateMenuItemOptionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.menuItemOption.update({
        where: { id },
        data,
        include: {
          choices: {
            where: { available: true },
            orderBy: { name: "asc" },
          },
        },
      })
    }),

  // Deletar uma opção
  delete: protectedProcedure
    .input(menuItemOptionIdSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.menuItemOption.delete({
        where: { id: input.id },
      })
    }),

  // Buscar uma opção específica
  byId: protectedProcedure
    .input(menuItemOptionIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.db.menuItemOption.findUnique({
        where: { id: input.id },
        include: {
          choices: {
            where: { available: true },
            orderBy: { name: "asc" },
          },
          menuItem: true,
        },
      })
    }),

  // Listar opções por item do menu
  byMenuItem: protectedProcedure
    .input(z.object({ menuItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.menuItemOption.findMany({
        where: {
          menuItemId: input.menuItemId,
        },
        include: {
          choices: {
            where: { available: true },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      })
    }),
}) 