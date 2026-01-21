import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";

export const emotionRulerRouter = createTRPCRouter({
  // Buscar a régua ativa
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();

    // Validar se o usuário tem a flag de novidades
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { novidades: true },
    });

    if (!user?.novidades) {
      return null;
    }

    const ruler = await ctx.db.emotionRuler.findFirst({
      where: {
        isActive: true,
        OR: [
          {
            startDate: null,
            endDate: null,
          },
          {
            startDate: { lte: today },
            endDate: { gte: today },
          },
          {
            startDate: { lte: today },
            endDate: null,
          },
          {
            startDate: null,
            endDate: { gte: today },
          },
        ],
      },
      include: {
        emotions: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ruler;
  }),

  // Verificar se deve mostrar o modal (primeiro acesso do dia)
  shouldShowModal: protectedProcedure.query(async ({ ctx }) => {
    const today = startOfDay(new Date());
    const userId = ctx.auth.userId;

    // Verificar se o usuário é Totem - não mostrar modal para Totem
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        role_config: true,
        novidades: true
      },
    });

    if (!user?.novidades) {
      return { shouldShow: false, ruler: null };
    }

    if (user?.role_config) {
      const roleConfig = user.role_config as { isTotem?: boolean };
      // Se for Totem, não mostrar o modal
      if (roleConfig.isTotem === true) {
        return { shouldShow: false, ruler: null };
      }
    }

    // Buscar régua ativa
    const ruler = await ctx.db.emotionRuler.findFirst({
      where: {
        isActive: true,
        OR: [
          {
            startDate: null,
            endDate: null,
          },
          {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          {
            startDate: { lte: new Date() },
            endDate: null,
          },
          {
            startDate: null,
            endDate: { gte: new Date() },
          },
        ],
      },
      include: {
        emotions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!ruler) {
      return { shouldShow: false, ruler: null };
    }

    // Verificar se já houve acesso hoje
    const todayAccess = await ctx.db.emotionRulerDailyAccess.findUnique({
      where: {
        userId_rulerId_date: {
          userId,
          rulerId: ruler.id,
          date: today,
        },
      },
    });

    // Se não houve acesso hoje, deve mostrar
    if (!todayAccess) {
      return { shouldShow: true, ruler };
    }

    // Se já houve acesso e foi fechado no X ou respondido, não mostrar
    return { shouldShow: false, ruler };
  }),

  // Registrar acesso (quando modal é aberto)
  registerAccess: protectedProcedure
    .input(z.object({ rulerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const today = startOfDay(new Date());
      const userId = ctx.auth.userId;

      // Verificar se já existe acesso hoje
      const existingAccess = await ctx.db.emotionRulerDailyAccess.findUnique({
        where: {
          userId_rulerId_date: {
            userId,
            rulerId: input.rulerId,
            date: today,
          },
        },
      });

      if (existingAccess) {
        // Atualizar apenas o accessedAt
        return await ctx.db.emotionRulerDailyAccess.update({
          where: { id: existingAccess.id },
          data: { accessedAt: new Date() },
        });
      }

      // Criar novo acesso
      return await ctx.db.emotionRulerDailyAccess.create({
        data: {
          userId,
          rulerId: input.rulerId,
          date: today,
          accessedAt: new Date(),
        },
      });
    }),

  // Registrar fechamento no X
  registerDismissal: protectedProcedure
    .input(z.object({ rulerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const today = startOfDay(new Date());
      const userId = ctx.auth.userId;

      const access = await ctx.db.emotionRulerDailyAccess.findUnique({
        where: {
          userId_rulerId_date: {
            userId,
            rulerId: input.rulerId,
            date: today,
          },
        },
      });

      if (!access) {
        // Criar acesso se não existir
        return await ctx.db.emotionRulerDailyAccess.create({
          data: {
            userId,
            rulerId: input.rulerId,
            date: today,
            accessedAt: new Date(),
            wasDismissed: true,
          },
        });
      }

      // Atualizar para marcado como fechado
      return await ctx.db.emotionRulerDailyAccess.update({
        where: { id: access.id },
        data: { wasDismissed: true },
      });
    }),

  // Criar resposta
  createResponse: protectedProcedure
    .input(
      z.object({
        rulerId: z.string(),
        emotionValue: z.number().min(0).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const today = startOfDay(new Date());
      const userId = ctx.auth.userId;

      // Criar resposta
      const response = await ctx.db.emotionRulerResponse.create({
        data: {
          userId,
          rulerId: input.rulerId,
          emotionValue: input.emotionValue,
          comment: input.comment,
        },
      });

      // Atualizar ou criar acesso diário marcando como respondido
      const access = await ctx.db.emotionRulerDailyAccess.findUnique({
        where: {
          userId_rulerId_date: {
            userId,
            rulerId: input.rulerId,
            date: today,
          },
        },
      });

      if (access) {
        await ctx.db.emotionRulerDailyAccess.update({
          where: { id: access.id },
          data: { responded: true },
        });
      } else {
        await ctx.db.emotionRulerDailyAccess.create({
          data: {
            userId,
            rulerId: input.rulerId,
            date: today,
            accessedAt: new Date(),
            responded: true,
          },
        });
      }

      return response;
    }),

  // Admin: Buscar todas as réguas
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Verificar permissão admin (sudo ou admin_pages com /admin/emotion-ruler)
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      select: { role_config: true },
    });

    if (!user?.role_config) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acesso negado",
      });
    }

    const roleConfig = user.role_config as {
      sudo?: boolean;
      admin_pages?: string[];
    };

    if (
      !roleConfig.sudo &&
      !roleConfig.admin_pages?.includes("/admin/emotion-ruler")
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acesso negado",
      });
    }

    return await ctx.db.emotionRuler.findMany({
      include: {
        emotions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            responses: true,
            dailyAccesses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Admin: Buscar régua por ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verificar permissão admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });

      if (!user?.role_config) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const roleConfig = user.role_config as {
        sudo?: boolean;
        admin_pages?: string[];
        can_manage_emotion_rules?: boolean;
      };

      if (
        !roleConfig.sudo &&
        !roleConfig.can_manage_emotion_rules &&
        !roleConfig.admin_pages?.includes("/admin/emotion-ruler")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      return await ctx.db.emotionRuler.findUnique({
        where: { id: input.id },
        include: {
          emotions: {
            orderBy: { order: "asc" },
          },
        },
      });
    }),

  // Admin: Criar régua
  create: protectedProcedure
    .input(
      z.object({
        question: z.string().min(1),
        isActive: z.boolean().default(false),
        startDate: z.date().optional().nullable(),
        endDate: z.date().optional().nullable(),
        backgroundColor: z.string().optional().nullable(),
        emotions: z.array(
          z.object({
            value: z.number().min(0).max(5),
            emoji: z.string().optional().nullable(),
            color: z.string(),
            states: z.array(z.string()).default([]),
            order: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });

      if (!user?.role_config) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const roleConfig = user.role_config as {
        sudo?: boolean;
        admin_pages?: string[];
        can_manage_emotion_rules?: boolean;
      };

      if (
        !roleConfig.sudo &&
        !roleConfig.can_manage_emotion_rules &&
        !roleConfig.admin_pages?.includes("/admin/emotion-ruler")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      // Se está ativando uma régua, desativar as outras
      if (input.isActive) {
        await ctx.db.emotionRuler.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      const ruler = await ctx.db.emotionRuler.create({
        data: {
          question: input.question,
          isActive: input.isActive,
          startDate: input.startDate ?? null,
          endDate: input.endDate ?? null,
          backgroundColor: input.backgroundColor ?? null,
          emotions: {
            create: input.emotions.map((emotion) => ({
              value: emotion.value,
              emoji: emotion.emoji ?? null,
              color: emotion.color,
              states: emotion.states,
              order: emotion.order,
            })),
          },
        },
        include: {
          emotions: {
            orderBy: { order: "asc" },
          },
        },
      });

      return ruler;
    }),

  // Admin: Atualizar régua
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        question: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
        startDate: z.date().optional().nullable(),
        endDate: z.date().optional().nullable(),
        backgroundColor: z.string().optional().nullable(),
        allowedUserIds: z.array(z.string()).optional().nullable(), // TESTE: IDs de usuários específicos
        emotions: z
          .array(
            z.object({
              id: z.string().optional(),
              value: z.number().min(0).max(5),
              emoji: z.string().optional().nullable(),
              color: z.string(),
              states: z.array(z.string()).default([]),
              order: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar permissão admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });

      if (!user?.role_config) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const roleConfig = user.role_config as {
        sudo?: boolean;
        admin_pages?: string[];
        can_manage_emotion_rules?: boolean;
      };

      if (
        !roleConfig.sudo &&
        !roleConfig.can_manage_emotion_rules &&
        !roleConfig.admin_pages?.includes("/admin/emotion-ruler")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      // Se está ativando uma régua, desativar as outras
      if (input.isActive) {
        await ctx.db.emotionRuler.updateMany({
          where: { isActive: true, id: { not: input.id } },
          data: { isActive: false },
        });
      }

      const { id, emotions, ...updateData } = input;

      // Atualizar emoções se fornecidas
      if (emotions) {
        // Deletar emoções que não estão na lista
        const emotionIdsToKeep = emotions
          .map((e) => e.id)
          .filter((id): id is string => !!id);

        await ctx.db.emotionRulerEmotion.deleteMany({
          where: {
            rulerId: id,
            id: { notIn: emotionIdsToKeep },
          },
        });

        // Atualizar ou criar emoções
        for (const emotion of emotions) {
          if (emotion.id) {
            await ctx.db.emotionRulerEmotion.update({
              where: { id: emotion.id },
              data: {
                value: emotion.value,
                emoji: emotion.emoji ?? null,
                color: emotion.color,
                states: emotion.states,
                order: emotion.order,
              },
            });
          } else {
            await ctx.db.emotionRulerEmotion.create({
              data: {
                rulerId: id,
                value: emotion.value,
                emoji: emotion.emoji ?? null,
                color: emotion.color,
                states: emotion.states,
                order: emotion.order,
              },
            });
          }
        }
      }

      // Atualizar dados da régua
      const updatedRuler = await ctx.db.emotionRuler.update({
        where: { id },
        data: updateData,
        include: {
          emotions: {
            orderBy: { order: "asc" },
          },
        },
      });

      return updatedRuler;
    }),

  // Admin: Buscar estatísticas/KPIs
  getStats: protectedProcedure
    .input(
      z.object({
        rulerId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verificar permissão admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });

      if (!user?.role_config) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const roleConfig = user.role_config as {
        sudo?: boolean;
        admin_pages?: string[];
        can_manage_emotion_rules?: boolean;
      };

      if (
        !roleConfig.sudo &&
        !roleConfig.can_manage_emotion_rules &&
        !roleConfig.admin_pages?.includes("/admin/emotion-ruler")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const startDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const endDate = input.endDate ? endOfDay(input.endDate) : undefined;

      // Total de acessos
      const totalAccesses = await ctx.db.emotionRulerDailyAccess.count({
        where: {
          rulerId: input.rulerId,
          ...(startDate && endDate
            ? {
              date: {
                gte: startDate,
                lte: endDate,
              },
            }
            : {}),
        },
      });

      // Total de respostas
      const totalResponses = await ctx.db.emotionRulerResponse.count({
        where: {
          rulerId: input.rulerId,
          ...(startDate && endDate
            ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
            : {}),
        },
      });

      // Respostas por emoção (agora 0-5)
      const responsesByEmotion = await ctx.db.emotionRulerResponse.groupBy({
        by: ["emotionValue"],
        where: {
          rulerId: input.rulerId,
          ...(startDate && endDate
            ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
            : {}),
        },
        _count: {
          id: true,
        },
      });

      // Calcular percentuais
      const emotionPercentages = responsesByEmotion.map((item: { emotionValue: number; _count: { id: number } }) => ({
        value: item.emotionValue,
        count: item._count.id,
        percentage:
          totalResponses > 0
            ? (item._count.id / totalResponses) * 100
            : 0,
      }));

      return {
        totalAccesses,
        totalResponses,
        responseRate:
          totalAccesses > 0 ? (totalResponses / totalAccesses) * 100 : 0,
        emotionPercentages,
      };
    }),

  // Admin: Buscar respostas para relatório
  getResponses: protectedProcedure
    .input(
      z.object({
        rulerId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(10000).default(1000),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verificar permissão admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      });

      if (!user?.role_config) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const roleConfig = user.role_config as {
        sudo?: boolean;
        admin_pages?: string[];
        can_manage_emotion_rules?: boolean;
      };

      if (
        !roleConfig.sudo &&
        !roleConfig.can_manage_emotion_rules &&
        !roleConfig.admin_pages?.includes("/admin/emotion-ruler")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const startDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const endDate = input.endDate ? endOfDay(input.endDate) : undefined;

      const responses = await ctx.db.emotionRulerResponse.findMany({
        where: {
          rulerId: input.rulerId,
          ...(startDate && endDate
            ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
            : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              setor: true,
              enterprise: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.emotionRulerResponse.count({
        where: {
          rulerId: input.rulerId,
          ...(startDate && endDate
            ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
            : {}),
        },
      });

      return {
        responses,
        total,
      };
    }),
});
