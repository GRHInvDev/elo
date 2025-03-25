import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import type { Field } from "@/lib/form-types"
import { type InputJsonValue } from "@prisma/client/runtime/library";


export const formsRouter = createTRPCRouter({
    create: protectedProcedure
    .input(z.object({
        title: z.string().min(1, "O nome é obrigatório."),
        description: z.string().optional(),
        fields: z.custom<Field[]>()
    }))
    .mutation(async ({ ctx, input })=>{
        return await ctx.db.form.create({
            data: {...input, fields: input.fields as unknown as InputJsonValue[], userId: ctx.auth.userId}
        })
    }),

    update: protectedProcedure
    .input(z.object({
        id: z.string(),
        title: z.string().min(1, "O nome é obrigatório."),
        description: z.string().optional(),
        fields: z.custom<Field[]>()
    }))
    .mutation(async ({ ctx, input })=>{
        return await ctx.db.form.update({
            data: {...input, fields: input.fields as unknown as InputJsonValue[], userId: ctx.auth.userId},
            where: {
                id: input.id
            }
        })
    }),

    delete: protectedProcedure
    .input(z.object({
        id: z.string(),
    }))
    .mutation(async ({ ctx, input })=>{
        return await ctx.db.form.delete({
            where: {
                id: input.id
            }
        })
    }),

    list: protectedProcedure
    .query( async ({ ctx }) => {
        return await ctx.db.form.findMany()
    }),

    getById: protectedProcedure
    .input(z.object({
        id: z.string()
    }))
    .query( async ({ ctx, input }) => {
        return await ctx.db.form.findUnique({
            where: {
                id: input.id
            }
        })
    }),
    
});