import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"

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
        setor: true
      }
    });
  }),
})

