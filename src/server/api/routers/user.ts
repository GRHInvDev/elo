import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"
import { z } from 'zod';
import { clerkClient } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';
import { UserRole } from '@prisma/client';

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

  updateRole: adminProcedure.input(z.object({
    userId: z.string(),
    role: z.nativeEnum(UserRole),
  })).mutation(async ({ input }) => {
    try {
      await (await clerkClient()).users.updateUserMetadata(input.userId, {
        publicMetadata: {
          role: input.role,
        },
      });
      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user role in Clerk.',
        cause: error,
      });
    }
  })
})

