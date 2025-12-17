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

/**
 * Normaliza uma data para meia-noite UTC e retorna como string ISO 8601
 * @param date - Data a ser normalizada (pode ser Date ou string ISO 8601)
 * @returns String ISO 8601 formatada em UTC (ex: "2025-12-31T00:00:00.000Z")
 */
const normalizeBirthdayDate = (date: Date | string): string => {
  let year: number
  let month: number // 0-11
  let day: number

  if (typeof date === 'string') {
    // Se for string, pode ser ISO 8601 ou formato YYYY-MM-DD
    // Tenta extrair diretamente do formato YYYY-MM-DD primeiro (mais seguro)
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})/
    const dateMatch = dateRegex.exec(date)
    if (dateMatch) {
      // Formato YYYY-MM-DD - extrair diretamente sem conversão de timezone
      year = parseInt(dateMatch[1]!, 10)
      month = parseInt(dateMatch[2]!, 10) - 1 // Mês é 0-indexed
      day = parseInt(dateMatch[3]!, 10)
    } else {
      // String ISO 8601 completa (ex: "2025-12-15T03:00:00.000Z")
      // Extrair a parte da data (YYYY-MM-DD) da string ISO
      const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})T/
      const isoDateMatch = isoDateRegex.exec(date)
      if (isoDateMatch) {
        // Extrair diretamente da string ISO sem parsear como Date
        year = parseInt(isoDateMatch[1]!, 10)
        month = parseInt(isoDateMatch[2]!, 10) - 1
        day = parseInt(isoDateMatch[3]!, 10)
      } else {
        // Fallback: parsear como Date e usar getters locais
        const parsedDate = new Date(date)
        year = parsedDate.getFullYear()
        month = parsedDate.getMonth()
        day = parsedDate.getDate()
      }
    }
  } else {
    // Date object - usar getters locais para preservar o dia/mês/ano selecionado
    // O date picker HTML retorna datas no timezone local do usuário
    // Quando serializado pelo tRPC, pode ter sido convertido, mas os getters locais
    // ainda vão pegar o dia correto se a data foi criada corretamente no frontend
    year = date.getFullYear()
    month = date.getMonth() // 0-11
    day = date.getDate()
  }
  
  // Construir a data UTC usando os componentes extraídos
  // Isso garante que o dia/mês/ano selecionado pelo usuário seja preservado
  const normalizedDate = new Date(Date.UTC(
    year,
    month,
    day,
    0, // hora
    0, // minuto
    0, // segundo
    0  // ms
  ))
  
  // Retorna como string ISO 8601 em UTC
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

    // Normaliza a data para string ISO 8601 UTC antes de salvar
    const normalizedDateISO = normalizeBirthdayDate(input.data)

    return ctx.db.birthday.create({
      data: {
        name: input.name,
        // Isso garante que a data seja armazenada exatamente como especificada em UTC
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
        data: z.date().optional(),
        userId: z.string().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Normaliza a data para string ISO 8601 UTC antes de salvar, se fornecida
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
    // Usa UTC para evitar problemas de timezone
    const currentMonth = now.getUTCMonth() + 1 // JavaScript months are 0-indexed

    // Função auxiliar para extrair apenas ano, mês e dia de uma data UTC
    // Ignora a hora para evitar problemas de timezone
    const getDateComponents = (date: Date) => {
      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
      }
    }

    // Busca todos os aniversários
    const allBirthdays = await ctx.db.birthday.findMany({
      include: { user: true },
    })

    // Filtra os aniversários do mês atual em JavaScript
    // Normaliza as datas para UTC e compara apenas mês/dia, ignorando hora
    const currentMonthBirthdays = allBirthdays.filter((birthday) => {
      const birthdayDate = new Date(birthday.data)
      const birthdayComponents = getDateComponents(birthdayDate)
      
      let matches = birthdayComponents.month === currentMonth
      
      // SPE (SOLUÇÃO PALEATIVA EMERGENCIAL): o maldito aniversário que cai no dia 31 não é exibido. Assim ele é.
      // não mexa
      if (currentMonth === 12 && birthdayComponents.month === 1 && birthdayComponents.day === 1) {
        matches = true
      }
      
      return matches
    })

    return currentMonthBirthdays.sort((a, b) => {
      const dateA = getDateComponents(new Date(a.data))
      const dateB = getDateComponents(new Date(b.data))
      
      // Se um é 01/01 e o outro não, o 01/01 vai para o final (como se fosse 31/12)
      if (dateA.month === 1 && dateA.day === 1 && !(dateB.month === 1 && dateB.day === 1)) {
        return 1 // a vai depois de b
      }
      if (dateB.month === 1 && dateB.day === 1 && !(dateA.month === 1 && dateA.day === 1)) {
        return -1 // b vai depois de a
      }
      
      // Ordenação normal por dia
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
          data: z.date(),
          userId: z.string().optional(),
          imageUrl: z.string().optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      // Cria todos os aniversários em uma única transação
      // Normaliza todas as datas para string ISO 8601 UTC antes de salvar
      // Formato: "2025-12-31T00:00:00.000Z" (sempre UTC, sempre meia-noite)
      return ctx.db.$transaction(
        input.map((birthday) =>
          ctx.db.birthday.create({
            data: {
              name: birthday.name,
              // Prisma aceita string ISO 8601 e converte automaticamente para DateTime
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
    const todayMonth = today.getUTCMonth() + 1 // JavaScript months are 0-indexed
    const todayDay = today.getUTCDate()

    // Busca todos os aniversários
    const allBirthdays = await ctx.db.birthday.findMany({
      include: { user: true },
    })

    // Filtra os aniversários de hoje (mesmo mês e dia, independente do ano)
    // Normaliza as datas para UTC para evitar problemas de timezone
    const todayBirthdays = allBirthdays.filter((birthday) => {
      const birthdayDate = new Date(birthday.data)
      const birthdayMonth = birthdayDate.getUTCMonth() + 1
      const birthdayDay = birthdayDate.getUTCDate()
      return birthdayMonth === todayMonth && birthdayDay === todayDay
    })

    return todayBirthdays
  }),

})

