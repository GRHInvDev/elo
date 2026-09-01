import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const CampaignStatusEnum = z.enum(["DRAFT", "ACTIVE", "CLOSED"]);

export const campaignRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          status: z.array(CampaignStatusEnum).optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.CampaignWhereInput = {
        status: input?.status ? { in: input.status } : undefined,
        name: input?.search
          ? { contains: input.search, mode: Prisma.QueryMode.insensitive }
          : undefined,
      };

      const campaigns = await ctx.db.campaign.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          _count: {
            select: {
              suggestions: true,
            },
          },
          suggestions: {
            select: {
              userId: true,
              status: true,
            },
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return campaigns.map((c) => {
        const uniqueParticipants = new Set(c.suggestions.map((s) => s.userId)).size;
        const implementedCount = c.suggestions.filter((s) => s.status === "DONE").length;

        return {
          id: c.id,
          name: c.name,
          objective: c.objective,
          startDate: c.startDate,
          endDate: c.endDate,
          status: c.status,
          isPrivate: c.isPrivate,
          createdById: c.createdById,
          createdBy: c.createdBy,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          ideasCount: c._count.suggestions,
          participantsCount: uniqueParticipants,
          implementedCount,
        };
      });
    }),

  listPublicActive: protectedProcedure.query(async ({ ctx }) => {
    const campaigns = await ctx.db.campaign.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: { endDate: "asc" },
      include: {
        _count: {
          select: {
            suggestions: true,
          },
        },
        suggestions: {
          select: {
            userId: true,
          },
        },
      },
    });

    return campaigns.map((c) => {
      const uniqueParticipants = new Set(c.suggestions.map((s) => s.userId)).size;

      return {
        id: c.id,
        name: c.name,
        objective: c.objective,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        isPrivate: c.isPrivate,
        ideasCount: c._count.suggestions,
        participantsCount: uniqueParticipants,
      };
    });
  }),

  listClosed: protectedProcedure.query(async ({ ctx }) => {
    const campaigns = await ctx.db.campaign.findMany({
      where: {
        status: "CLOSED",
      },
      orderBy: { endDate: "desc" },
      take: 3,
      include: {
        _count: {
          select: {
            suggestions: true,
          },
        },
        suggestions: {
          select: {
            status: true,
          },
        },
      },
    });

    return campaigns.map((c) => {
      const implementedCount = c.suggestions.filter(
        (s) => s.status === "DONE" || s.status === "APPROVED" || s.status === "IN_PROGRESS"
      ).length;

      return {
        id: c.id,
        name: c.name,
        objective: c.objective,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        ideasCount: c._count.suggestions,
        implementedCount,
      };
    });
  }),

  getClosedWinners: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              suggestions: true,
            },
          },
          suggestions: {
            where: {
              status: { in: ["APPROVED", "IN_PROGRESS", "DONE"] },
            },
            orderBy: [{ finalScore: "desc" }, { createdAt: "asc" }],
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  setor: true,
                },
              },
              _count: {
                select: {
                  supports: true,
                  comments: true,
                },
              },
            },
          },
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campanha não encontrada.",
        });
      }

      return {
        id: campaign.id,
        name: campaign.name,
        objective: campaign.objective,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status,
        totalIdeas: campaign._count.suggestions,
        winningIdeas: campaign.suggestions.map((s) => ({
          id: s.id,
          ideaNumber: s.ideaNumber,
          description: s.description,
          problem: s.problem,
          status: s.status,
          isNameVisible: s.isNameVisible,
          submittedName: s.submittedName,
          submittedSector: s.submittedSector,
          authorName: s.isNameVisible && s.user
            ? `${s.user.firstName ?? ""} ${s.user.lastName ?? ""}`.trim() || (s.submittedName ?? "Colaborador")
            : (s.submittedName ?? "Colaborador anônimo"),
          authorSector: (s.isNameVisible ? s.user?.setor : null) ?? s.submittedSector ?? "Geral",
          supportsCount: s._count.supports,
          commentsCount: s._count.comments,
          finalScore: s.finalScore,
          createdAt: s.createdAt,
        })),
      };
    }),

  getPublicById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.auth.userId;

      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              suggestions: true,
            },
          },
          suggestions: {
            orderBy: { createdAt: "desc" },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  setor: true,
                },
              },
              supports: {
                where: {
                  userId: currentUserId,
                },
                select: {
                  id: true,
                },
              },
              _count: {
                select: {
                  supports: true,
                  comments: true,
                },
              },
            },
          },
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campanha não encontrada.",
        });
      }

      // Se a campanha for privada:
      // Apenas o criador ou o próprio autor da ideia visualiza a lista.
      // Outros colaboradores veem apenas a proposta e suas próprias ideias.
      let visibleSuggestions = campaign.suggestions;
      if (campaign.isPrivate) {
        visibleSuggestions = campaign.suggestions.filter((s) => s.userId === currentUserId);
      }

      return {
        id: campaign.id,
        name: campaign.name,
        objective: campaign.objective,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status,
        isPrivate: campaign.isPrivate,
        ideasCount: campaign._count.suggestions,
        suggestions: visibleSuggestions.map((s) => {
          const isOwner = s.userId === currentUserId;
          const isNotImplemented = s.status === "NOT_IMPLEMENTED";

          const hideAuthor = !isOwner && isNotImplemented && campaign.status === "ACTIVE";

          const authorName = hideAuthor
            ? "Colaborador ocultado"
            : s.isNameVisible && s.user
            ? `${s.user.firstName ?? ""} ${s.user.lastName ?? ""}`.trim() || (s.submittedName ?? "Colaborador")
            : (s.submittedName ?? "Colaborador anônimo");

          const authorSector = hideAuthor ? null : (s.isNameVisible ? s.user?.setor : null) ?? s.submittedSector ?? null;

          return {
            id: s.id,
            ideaNumber: s.ideaNumber,
            description: s.description,
            problem: s.problem,
            status: s.status,
            isNameVisible: s.isNameVisible,
            authorName,
            authorSector,
            isAuthorHidden: hideAuthor,
            isOwner,
            isNotImplemented,
            supportsCount: s._count.supports,
            commentsCount: s._count.comments,
            hasSupported: s.supports.length > 0,
            createdAt: s.createdAt,
          };
        }),
      };
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              suggestions: true,
            },
          },
          suggestions: {
            orderBy: { createdAt: "desc" },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  setor: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campanha não encontrada.",
        });
      }

      const uniqueParticipants = new Set(campaign.suggestions.map((s) => s.userId)).size;
      const implementedCount = campaign.suggestions.filter((s) => s.status === "DONE").length;

      return {
        ...campaign,
        ideasCount: campaign._count.suggestions,
        participantsCount: uniqueParticipants,
        implementedCount,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "Nome da campanha deve ter pelo menos 2 caracteres."),
        objective: z.string().trim().min(5, "Objetivo da campanha deve ter pelo menos 5 caracteres."),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        status: CampaignStatusEnum.default("ACTIVE"),
        isPrivate: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.endDate < input.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A data de encerramento não pode ser anterior à data de início.",
        });
      }

      return await ctx.db.campaign.create({
        data: {
          name: input.name,
          objective: input.objective,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status,
          isPrivate: input.isPrivate,
          createdById: ctx.auth.userId,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().trim().min(2).optional(),
        objective: z.string().trim().min(5).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        status: CampaignStatusEnum.optional(),
        isPrivate: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.campaign.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campanha não encontrada.",
        });
      }

      const startDate = input.startDate ?? existing.startDate;
      const endDate = input.endDate ?? existing.endDate;

      if (endDate < startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A data de encerramento não pode ser anterior à data de início.",
        });
      }

      return await ctx.db.campaign.update({
        where: { id: input.id },
        data: {
          name: input.name,
          objective: input.objective,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status,
          isPrivate: input.isPrivate,
        },
      });
    }),

  close: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.campaign.update({
        where: { id: input.id },
        data: {
          status: "CLOSED",
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.campaign.delete({
        where: { id: input.id },
      });
      return { success: true, id: input.id };
    }),
});