import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { utapi } from "@/server/uploadthing";

const createFlyerSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  imageUrl: z.string().url("URL da imagem inválida"),
  published: z.boolean().default(false),
})

export const flyerRouter = createTRPCRouter({
  create: protectedProcedure.input(createFlyerSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.flyer.create({
      data: {
        ...input,
        authorId: ctx.auth.userId,
      },
    })
  }),

  update: protectedProcedure
    .input(createFlyerSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const flyer = await ctx.db.flyer.findUnique({
        where: { id: input.id },
      })

      if (!flyer || flyer.authorId !== ctx.auth.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar este encarte",
        })
      }

      await utapi.deleteFiles(flyer.imageUrl.replace("https://162synql7v.ufs.sh/f/", ""))

      return ctx.db.flyer.update({
        where: { id: input.id },
        data: input,
      })
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const flyer = await ctx.db.flyer.findUnique({
      where: { id: input.id },
    })

    if (!flyer || flyer.authorId !== ctx.auth.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para deletar este encarte",
      })
    }

    await utapi.deleteFiles(flyer.imageUrl.replace("https://162synql7v.ufs.sh/f/", ""))

    return ctx.db.flyer.delete({
      where: { id: input.id },
    })
  }),

  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.flyer.findMany({
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }),
})

