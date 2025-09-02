import { Enterprise } from "@prisma/client";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"
import { z } from "zod"

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        enterprise: true,
        setor: true,
        birthDay: true
      }
    })
  }),

  listAll: adminProcedure.query(async ({ ctx })=>{
    return await ctx.db.user.findMany();
  }),

  listAdmins: adminProcedure.query(async ({ ctx })=>{
    return await ctx.db.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        setor: true,
        enterprise: true
      }
    });
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      enterprise: z.string().min(1, "Empresa é obrigatória"),
      setor: z.string().min(1, "Setor é obrigatório"),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { id: ctx.auth.userId },
        data: {
          enterprise: input.enterprise as Enterprise,
          setor: input.setor,
        },
        select: {
          id: true,
          enterprise: true,
          setor: true,
        },
      })
    }),
})

