import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc"
import type { RolesConfig } from "@/types/role-config"

const createBirthdaySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  data: z.union([z.date(), z.string()]), // Aceitar tanto Date quanto string YYYY-MM-DD
  userId: z.string().optional(),
  imageUrl: z.string().optional(),
})

/**
 * @param date - Data em formato "YYYY-MM-DD" ou Date object
 * @returns String ISO 8601 em UTC (ex: "2025-01-05T00:00:00.000Z")
 */
const normalizeBirthdayDate = (date: Date | string): string => {
  let year: number
  let month: number // 0-11 no Date object, 1-12 na string
  let day: number

  if (typeof date === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
    if (match) {
      year = parseInt(match[1]!, 10)
      month = parseInt(match[2]!, 10) - 1 // Converter 1-12 para 0-11
      day = parseInt(match[3]!, 10)
    } else {
      // Fallback: tentar parsear como Date
      const parsed = new Date(date)
      year = parsed.getUTCFullYear()
      month = parsed.getUTCMonth()
      day = parsed.getUTCDate()
    }
  } else {
    year = date.getUTCFullYear()
    month = date.getUTCMonth()
    day = date.getUTCDate()
  }

  // Isso garante que o dia/mês/ano sejam preservados exatamente como fornecidos
  const normalizedDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))

  return normalizedDate.toISOString()
}

export const birthdayRouter = createTRPCRouter({
  // Criar um aniversário
  create: protectedProcedure.input(createBirthdaySchema).mutation(async ({ ctx, input }) => {
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

    const normalizedDateISO = normalizeBirthdayDate(input.data)

    return ctx.db.birthday.create({
      data: {
        name: input.name,
        data: normalizedDateISO,
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
        data: z.union([z.date(), z.string()]).optional(),
        userId: z.string().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedData = input.data ? normalizeBirthdayDate(input.data) : undefined

      return ctx.db.birthday.update({
        where: { id: input.id },
        data: {
          name: input.name,
          data: normalizedData,
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
        {
          data: "desc",
        },
      ],
    })
  }),

  // Listar aniversários do mês atual
  listCurrentMonth: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const currentMonth = now.getUTCMonth() + 1 // 1-12

    const getDateComponents = (date: Date) => {
      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1, // 1-12
        day: date.getUTCDate(),
      }
    }

    // Busca todos os aniversários
    const allBirthdays = await ctx.db.birthday.findMany({
      include: { user: true },
    })

    const currentMonthBirthdays = allBirthdays.filter((birthday) => {
      const birthdayDate = new Date(birthday.data)
      const birthdayComponents = getDateComponents(birthdayDate)
      
      let matches = birthdayComponents.month === currentMonth
      
      // SPE: Aniversário em 01/01 conta como 31/12 do mês anterior
      if (currentMonth === 12 && birthdayComponents.month === 1 && birthdayComponents.day === 1) {
        matches = true
      }
      
      return matches
    })

    return currentMonthBirthdays.sort((a, b) => {
      const dateA = getDateComponents(new Date(a.data))
      const dateB = getDateComponents(new Date(b.data))
      
      // 01/01 vai para o final (como se fosse 31/12)
      if (dateA.month === 1 && dateA.day === 1 && !(dateB.month === 1 && dateB.day === 1)) {
        return 1
      }
      if (dateB.month === 1 && dateB.day === 1 && !(dateA.month === 1 && dateA.day === 1)) {
        return -1
      }
      
      return dateA.day - dateB.day
    })
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
          data: z.union([z.date(), z.string()]),
          userId: z.string().optional(),
          imageUrl: z.string().optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(
        input.map((birthday) =>
          ctx.db.birthday.create({
            data: {
              name: birthday.name,
              data: normalizeBirthdayDate(birthday.data),
              userId: birthday.userId,
              imageUrl: birthday.imageUrl,
            },
          }),
        ),
      )
    }),

  // Verificar se hoje é aniversário de alguém
  getTodayBirthdays: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date()
    const todayMonth = today.getUTCMonth() + 1 // 1-12
    const todayDay = today.getUTCDate()

    // Busca todos os aniversários
    const allBirthdays = await ctx.db.birthday.findMany({
      include: { user: true },
    })

    // ✅ Filtra aniversários de hoje (mesmo mês e dia)
    const todayBirthdays = allBirthdays.filter((birthday) => {
      const birthdayDate = new Date(birthday.data)
      const birthdayMonth = birthdayDate.getUTCMonth() + 1
      const birthdayDay = birthdayDate.getUTCDate()
      return birthdayMonth === todayMonth && birthdayDay === todayDay
    })

    return todayBirthdays
  }),
})