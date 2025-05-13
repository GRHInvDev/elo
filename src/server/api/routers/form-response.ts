import { createTRPCRouter, protectedProcedure } from "../trpc"
import { z } from "zod"
import type { InputJsonValue } from "@prisma/client/runtime/library"
import type { ResponseStatus } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailSituacaoFormulario } from "@/lib/mail/html-mock"

export const formResponseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        responses: z.array(z.record(z.string(), z.any())),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.formResponse.create({
        data: {
          userId: ctx.auth.userId,
          formId: input.formId,
          responses: input.responses as unknown as InputJsonValue[],
          status: "NOT_STARTED",
        },
      })
    }),

  listByForm: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verificar se o usuário é o dono do formulário
      const form = await ctx.db.form.findUnique({
        where: { id: input.formId },
        select: { userId: true },
      })

      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Formulário não encontrado",
        })
      }

      const isOwner = form.userId === ctx.auth.userId

      if (isOwner) {
        // Se for o dono, retorna todas as respostas
        return await ctx.db.formResponse.findMany({
          where: {
            formId: input.formId,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      } else {
        // Se não for o dono, retorna apenas as respostas do usuário atual
        return await ctx.db.formResponse.findMany({
          where: {
            formId: input.formId,
            userId: ctx.auth.userId,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      }
    }),

  listKanBan: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.formResponse.findMany({
      where: {
        form: {
          userId: ctx.auth.userId,
        },
      },
      include: {
        form: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }),

  getChat: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.formResponseChat.findMany({
        where: {
          formResponseId: input.responseId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      })
    }),

  sendChatMessage: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se a resposta existe
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: {
          form: { select: { userId: true } },
          user: { select: { id: true } },
        },
      })

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada",
        })
      }

      // Verificar se o usuário é o dono do formulário ou o autor da resposta
      if (response.form.userId !== ctx.auth.userId && response.userId !== ctx.auth.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para enviar mensagens neste chat",
        })
      }

      return await ctx.db.formResponseChat.create({
        data: {
          userId: ctx.auth.userId,
          formResponseId: input.responseId,
          message: input.message,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      })
    }),

  listUserResponses: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.formResponse.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      include: {
        form: {
          select: {
            id: true,
            userId: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
        statusComment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se a resposta existe
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: { form: { select: { userId: true } } },
      })

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada",
        })
      }

      // Verificar se o usuário é o dono do formulário
      if (response.form.userId !== ctx.auth.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o dono do formulário pode atualizar o status",
        })
      }

      const ret = await ctx.db.formResponse.update({
        where: { id: input.responseId },
        data: {
          status: input.status as ResponseStatus,
          statusComment: input.statusComment,
          updatedAt: new Date(),
        },
        include: {
          form: true,
        },
      })

      const user = await ctx.db.user.findUnique({
        where: { id: response.userId },
      })

      if (ret && user) {
        await sendEmail(
          user.email,
          `Resposta ao formulário "${ret.form.title}"`,
          mockEmailSituacaoFormulario(user.firstName ?? "", ret.status, ret.id, ret.form.id, ret.form.title),
        )
      }

      return ret
    }),

  getById: protectedProcedure
    .input(
      z.object({
        responseId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: {
          form: {
            select: {
              id: true,
              title: true,
              description: true,
              fields: true,
              userId: true,
              user: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      })

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resposta não encontrada",
        })
      }

      // Verificar se o usuário é o dono do formulário ou o autor da resposta
      if (response.form.userId !== ctx.auth.userId && response.userId !== ctx.auth.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para visualizar esta resposta",
        })
      }

      return response
    }),
})
