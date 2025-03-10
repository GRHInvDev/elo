import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      include: {
        birthDay: true
      }
    })
  }),

  listAll: adminProcedure.query(async ({ ctx })=>{
    return await ctx.db.user.findMany();
  }),
})

