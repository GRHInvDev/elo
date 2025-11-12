import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"
import type { RolesConfig } from "@/types/role-config"

const createBirthdaySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  data: z.date(),
  userId: z.string().optional(),
  imageUrl: z.string().optional(),
})

export const birthdayRouter = createTRPCRouter({
  // Criar um aniversário
  create: protectedProcedure.input(createBirthdaySchema).mutation(async ({ ctx, input }) => {
    // Se não for especificado um userId, usa o do usuário atual
    const userId = input.userId

    // Verifica se já existe um aniversário para este usuário
    if (input.userId) {
      const existingBirthday = await ctx.db.birthday.findUnique({
        where: { userId: input.userId },
      })

      if (existingBirthday) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este usuário já possui um aniversário cadastrado",
        })
      }
    }

    return ctx.db.birthday.create({
      data: {
        name: input.name,
        data: input.data,
        userId,
        imageUrl: input.imageUrl,
      },
    })
  }),

  // Atualizar um aniversário
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Nome é obrigatório").optional(),
        data: z.date().optional(),
        userId: z.string().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.birthday.update({
        where: { id: input.id },
        data: {
          name: input.name,
          data: input.data,
          userId: input.userId,
          imageUrl: input.imageUrl
        },
      })
    }),

  // Deletar um aniversário
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const birthday = await ctx.db.birthday.findUnique({
      where: { id: input.id },
    })

    if (!birthday) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Aniversário não encontrado",
      })
    }

    // Verifica se o usuário é o dono do aniversário ou um admin
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
    })

    const roleConfig = user?.role_config as RolesConfig;
    const hasAdminAccess = roleConfig?.sudo || (Array.isArray(roleConfig?.admin_pages) && roleConfig.admin_pages.includes("/admin"));
    
    if (birthday.userId !== ctx.auth.userId && !hasAdminAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para deletar este aniversário",
      })
    }

    return ctx.db.birthday.delete({
      where: { id: input.id },
    })
  }),

  // Buscar um aniversário específico
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.birthday.findUnique({
      where: { id: input.id },
      include: { user: true },
    })
  }),

  // Listar todos os aniversários
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.birthday.findMany({
      include: { user: true },
      orderBy: [
        // Ordena por mês e dia, independente do ano
        {
          data: "desc",
        },
      ],
    })
  }),

  // Listar aniversários do mês atual
  listCurrentMonth: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed

    // Usando uma abordagem diferente com Prisma
    const allBirthdays = await ctx.db.birthday.findMany({
      include: { user: true },
    })

    // Filtra os aniversários do mês atual em JavaScript
    const currentMonthBirthdays = allBirthdays.filter((birthday) => {
      const birthdayMonth = birthday.data.getMonth() + 1
      return birthdayMonth === currentMonth
    })

    // Ordena por dia
    return currentMonthBirthdays.sort((a, b) => a.data.getDate() - b.data.getDate())
  }),

  // Buscar aniversário do usuário atual
  getMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.birthday.findUnique({
      where: { userId: ctx.auth.userId },
    })
  }),

  // Importar aniversários (admin only)
  importBirthdays: adminProcedure
    .input(
      z.array(
        z.object({
          name: z.string(),
          data: z.date(),
          userId: z.string().optional(),
          imageUrl: z.string().optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      // Cria todos os aniversários em uma única transação
      return ctx.db.$transaction(
        input.map((birthday) =>
          ctx.db.birthday.create({
            data: {
              name: birthday.name,
              data: birthday.data,
              userId: birthday.userId,
              imageUrl: birthday.imageUrl,
            },
          }),
        ),
      )
    }),

  // Verificar se hoje é aniversário de alguém
  getTodayBirthdays: protectedProcedure.query(async ({ ctx }) => {
    // Usa UTC para evitar problemas de timezone
    const today = new Date()
    const todayMonth = today.getMonth() + 1 // JavaScript months are 0-indexed
    const todayDay = today.getDate()

    // Busca todos os aniversários
    const allBirthdays = await ctx.db.birthday.findMany({
      include: { user: true },
    })

    // Filtra os aniversários de hoje (mesmo mês e dia, independente do ano)
    const todayBirthdays = allBirthdays.filter((birthday) => {
      const birthdayDate = new Date(birthday.data)
      const birthdayMonth = birthdayDate.getMonth() + 1
      const birthdayDay = birthdayDate.getDate()
      return birthdayMonth === todayMonth && birthdayDay === todayDay
    })

    return todayBirthdays
  }),
})

