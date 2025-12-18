import { createTRPCRouter, protectedProcedure, middleware } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import type { InputJsonValue } from "@prisma/client/runtime/library"
import { db } from "@/server/db"
import { sendEmail } from "@/lib/mail/email-utils"
import { mockEmailNotificacaoSugestao } from "@/lib/mail/html-mock"
import type { RolesConfig } from "@/types/role-config"

const StatusEnum = z.enum(["NEW","IN_REVIEW","APPROVED","IN_PROGRESS","DONE","NOT_IMPLEMENTED"])

const ScoreItem = z.object({
  text: z.string().max(2000).optional(),
  score: z.number().min(0).max(10).optional(),
  // Manter compatibilidade com formato antigo
  label: z.string().optional(),
})

// Middleware para admin inline
const adminMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Você deve estar logado para acessar esta funcionalidade.",
    })
  }

  const user = await ctx.db.user.findUnique({
    where: { id: ctx.auth.userId },
    select: { role_config: true, email: true },
  })

  const roleConfig = user?.role_config as RolesConfig;
  const hasAdminAccess = roleConfig?.sudo || (Array.isArray(roleConfig?.admin_pages) && roleConfig.admin_pages.includes("/admin"));
  
  if (!user || !hasAdminAccess) {
    throw new TRPCError({
      code: "FORBIDDEN", 
      message: "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: {
        ...user,
        id: ctx.auth.userId,
      },
    },
  })
})

// Procedure protegido para admins
const adminProcedure = protectedProcedure.use(adminMiddleware)

// Helper para validar edição de sugestão
async function validateSuggestionEdit(
  dbInstance: typeof db,
  suggestionId: string,
  userId: string
): Promise<{
  id: string
  userId: string
  status: string
  description: string
  problem: string | null
  editHistory: unknown
  isTextEdited: boolean
}> {
  const suggestion = await dbInstance.suggestion.findUnique({
    where: { id: suggestionId },
    select: {
      id: true,
      userId: true,
      status: true,
      description: true,
      problem: true,
      editHistory: true,
      isTextEdited: true,
    },
  })

  if (!suggestion) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Ideia não encontrada"
    })
  }

  if (suggestion.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você só pode editar suas próprias ideias"
    })
  }

  if (suggestion.status !== "NEW") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Apenas ideias com status 'Não avaliado' podem ser editadas"
    })
  }

  return suggestion
}

// Helper para atualizar histórico de edições
function updateEditHistory(
  existingHistory: unknown,
  fieldName: "description" | "problem",
  currentValue: string | null
): Record<string, unknown> {
  const normalizedValue = currentValue ?? ""
  
  // O histórico pode ter estrutura: { description: {...}, problem: {...} }
  // ou estrutura antiga (legado): { "texto-original": "...", "edicao-1": "..." }
  let editHistory: Record<string, unknown> = {}
  
  if (!existingHistory) {
    // Criar novo histórico com estrutura separada para description e problem
    editHistory = {
      [fieldName]: {
        "texto-original": normalizedValue,
      }
    }
  } else {
    const existing = existingHistory as Record<string, unknown>
    
    // Verificar se já tem estrutura explícita (description ou problem)
    const hasExplicitDescription = existing.description && typeof existing.description === "object"
    const hasExplicitProblem = existing.problem && typeof existing.problem === "object"
    
    // Verificar se é histórico legado não estruturado (tem edicao-* mas não tem description/problem)
    const hasLegacyEntries = Object.keys(existing).some(key => key.startsWith("edicao-") || key === "texto-original")
    const isLegacyUnstructured = hasLegacyEntries && !hasExplicitDescription && !hasExplicitProblem
    
    const fieldHistory = existing[fieldName]
    
    if (fieldHistory && typeof fieldHistory === "object") {
      // Já existe histórico estruturado do campo - adicionar nova edição
      const history = fieldHistory as Record<string, string>
      editHistory = { ...existing }
      const editKeys = Object.keys(history).filter(key => key.startsWith("edicao-"))
      const nextEditNumber = editKeys.length + 1
      history[`edicao-${nextEditNumber}`] = normalizedValue
      editHistory[fieldName] = history
      
      // Preservar o outro campo se existir
      if (fieldName === "description" && hasExplicitProblem) {
        editHistory.problem = existing.problem
      } else if (fieldName === "problem" && hasExplicitDescription) {
        editHistory.description = existing.description
      }
    } else if (isLegacyUnstructured) {
      // Histórico legado não estruturado - não assumir que pertence ao campo atual
      // Preservar legado em _legacy e inicializar campo com texto atual
      editHistory = {
        [fieldName]: {
          "texto-original": normalizedValue,
        },
        _legacy: existing, // Preservar histórico legado para revisão manual
      }
      
      // Preservar o outro campo se existir explicitamente
      if (fieldName === "description" && hasExplicitProblem) {
        editHistory.problem = existing.problem
      } else if (fieldName === "problem" && hasExplicitDescription) {
        editHistory.description = existing.description
      }
    } else {
      // Não existe histórico do campo e não é legado - criar novo
      editHistory = { ...existing }
      editHistory[fieldName] = {
        "texto-original": normalizedValue,
      }
      
      // Preservar o outro campo se existir
      if (fieldName === "description" && hasExplicitProblem) {
        editHistory.problem = existing.problem
      } else if (fieldName === "problem" && hasExplicitDescription) {
        editHistory.description = existing.description
      }
    }
  }
  
  return editHistory
}

export const suggestionRouter = createTRPCRouter({
  // Criar ideia (caixa)
  create: protectedProcedure
    .input(z.object({
      submittedName: z.string().trim().optional(),
      submittedSector: z.string().trim().optional(),
      description: z.string().trim().min(1), // Solução proposta
      problem: z.string().trim().optional(), // Problema identificado
      contribution: z.object({
        type: z.enum(["IDEIA_INOVADORA","SUGESTAO_MELHORIA","SOLUCAO_PROBLEMA","OUTRO"]),
        other: z.string().trim().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Bloquear usuários TOTEM de submeter sugestões
      const me = await ctx.db.user.findUnique({
        where: { id: ctx.auth.userId },
        select: { role_config: true },
      })
      const roleConfig = (me?.role_config ?? {}) as RolesConfig
      if (roleConfig?.isTotem) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuários Totem não podem submeter sugestões.",
        })
      }

      const last = await ctx.db.suggestion.findFirst({
        orderBy: { ideaNumber: "desc" },
        select: { ideaNumber: true },
      })
      const ideaNumber = (last?.ideaNumber ?? 99) + 1

      const suggestion = await ctx.db.suggestion.create({
        data: {
          ideaNumber,
          userId: ctx.auth.userId,
          submittedName: input.submittedName ?? null,
          submittedSector: input.submittedSector ?? null,
          description: input.description, // Solução proposta
          problem: input.problem ?? null, // Problema identificado
          contribution: input.contribution as InputJsonValue,
          dateRef: new Date(),
          status: "NEW",
        },
      })
      return suggestion
    }),

  // Criar ideia manualmente (admin)
  createManual: adminProcedure
    .input(z.object({
      submittedName: z.string().trim().optional(),
      submittedSector: z.string().trim().optional(),
      isNameVisible: z.boolean().default(true),
      description: z.string().trim().min(1), // Solução proposta
      problem: z.string().trim().min(1), // Problema identificado
      contribution: z.object({
        type: z.enum(["IDEIA_INOVADORA","SUGESTAO_MELHORIA","SOLUCAO_PROBLEMA","OUTRO"]),
        other: z.string().trim().optional(),
      }),
      impact: z.object({
        text: z.string().max(2000),
        score: z.number().min(0).max(10),
      }).optional(),
      capacity: z.object({
        text: z.string().max(2000),
        score: z.number().min(0).max(10),
      }).optional(),
      effort: z.object({
        text: z.string().max(2000),
        score: z.number().min(0).max(10),
      }).optional(),
      analystId: z.string().optional(),
      status: StatusEnum.default("NEW"),
      rejectionReason: z.string().optional(),
      payment: z.object({
        status: z.enum(["paid", "unpaid"]),
        amount: z.number().optional(),
        description: z.string().optional(),
      }).optional(),
      paymentDate: z.date().optional(),
      userId: z.string().optional(), // Para atribuir a outro usuário
    }))
    .mutation(async ({ ctx, input }) => {
      // Gerar próximo número de ideia
      const last = await ctx.db.suggestion.findFirst({
        orderBy: { ideaNumber: "desc" },
        select: { ideaNumber: true },
      })
      const ideaNumber = (last?.ideaNumber ?? 99) + 1

      // Calcular pontuação final se todas as classificações estiverem presentes
      const impactScore = input.impact?.score ?? null
      const capacityScore = input.capacity?.score ?? null
      const effortScore = input.effort?.score ?? null

      const finalScore = 
        [impactScore, capacityScore, effortScore].every((v) => typeof v === "number")
          ? (impactScore! + capacityScore! - effortScore!)
          : null

      const finalClassification = 
        typeof finalScore === "number"
          ? (finalScore >= 15
              ? { label: "Aprovar para Gestores", range: "15-20" }
              : finalScore >= 10
                ? { label: "Ajustar e incubar", range: "10-14" }
                : { label: "Descartar com justificativa clara", range: "0-9" })
          : null

      // Validar se o usuário existe (se fornecido)
      if (input.userId) {
        const userExists = await ctx.db.user.findUnique({
          where: { id: input.userId },
          select: { id: true },
        })
        if (!userExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Usuário não encontrado"
          })
        }
      }

      // Validar se o analista existe (se fornecido)
      if (input.analystId) {
        const analystExists = await ctx.db.user.findUnique({
          where: { id: input.analystId },
          select: { id: true },
        })
        if (!analystExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Analista não encontrado ou não é admin"
          })
        }
      }

      // Validar motivo para status "NOT_IMPLEMENTED"
      if (input.status === "NOT_IMPLEMENTED" && !input.rejectionReason?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Motivo da não implementação é obrigatório"
        })
      }

      // Buscar ou criar usuário "Não atribuído" quando não há userId especificado
      let userIdToAssign = input.userId
      if (!userIdToAssign) {
        const UNASSIGNED_USER_ID = "Não atribuído"
        const UNASSIGNED_USER_EMAIL = "sistema@elo.boxdistribuidor"
        
        const unassignedUser = await ctx.db.user.upsert({
          where: {
            email: UNASSIGNED_USER_EMAIL
          },
          update: {
            // Garantir que setor seja nulo ao atualizar
            setor: null
          },
          create: {
            id: UNASSIGNED_USER_ID,
            email: UNASSIGNED_USER_EMAIL,
            firstName: "Não",
            lastName: "Atribuído",
            setor: null, // Setor nulo conforme solicitado
            enterprise: "NA",
            role_config: {
              sudo: false,
              admin_pages: [],
              can_create_form: false,
              can_create_event: false,
              can_create_flyer: false,
              can_create_booking: false,
              can_locate_cars: false,
              can_view_dre_report: false,
              isTotem: false
            }
          }
        })
        userIdToAssign = unassignedUser.id
      }

      const suggestion = await ctx.db.suggestion.create({
        data: {
          ideaNumber,
          userId: userIdToAssign,
          submittedName: input.submittedName,
          submittedSector: input.submittedSector,
          isNameVisible: input.isNameVisible,
          description: input.description,
          problem: input.problem,
          contribution: input.contribution as InputJsonValue,
          impact: input.impact as InputJsonValue,
          capacity: input.capacity as InputJsonValue,
          effort: input.effort as InputJsonValue,
          finalScore,
          finalClassification: finalClassification as InputJsonValue,
          status: input.status,
          rejectionReason: input.rejectionReason,
          analystId: input.analystId,
          payment: input.payment as InputJsonValue,
          paymentDate: input.paymentDate,
          dateRef: new Date(),
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              setor: true,
            },
          },
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      // Criar notificação para o usuário (se não for o próprio admin e não for o usuário "Não atribuído")
      const UNASSIGNED_USER_EMAIL = "nao-atribuido@interno.sistema"
      const assignedUser = await ctx.db.user.findUnique({
        where: { id: userIdToAssign },
        select: { email: true }
      })
      const isUnassignedUser = assignedUser?.email === UNASSIGNED_USER_EMAIL

      if (input.userId && input.userId !== ctx.user.id && !isUnassignedUser) {
        try {
          await ctx.db.notification.create({
            data: {
              title: "Nova Ideia Criada",
              message: `Uma nova ideia #${ideaNumber} foi criada em seu nome.`,
              type: "SUGGESTION_CREATED",
              channel: "IN_APP",
              userId: input.userId,
              entityId: suggestion.id,
              entityType: "suggestion",
              actionUrl: `/my-suggestions`
            }
          })
        } catch (notificationError) {
          console.error("Erro ao criar notificação:", notificationError)
        }
      }

      return suggestion
    }),

  // Listagem para admin (filtros simples)
  list: adminProcedure
    .input(z.object({
      status: z.array(StatusEnum).optional(),
      search: z.string().optional(),
      take: z.number().min(1).max(1000).default(50),
      skip: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where = {
        status: input?.status ? { in: input.status } : undefined,
        description: input?.search
          ? { contains: input.search, mode: Prisma.QueryMode.insensitive }
          : undefined,
      }
      return ctx.db.suggestion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input?.take,
        skip: input?.skip,
        select: {
          id: true,
          ideaNumber: true,
          userId: true,
          submittedName: true,
          submittedSector: true,
          isNameVisible: true,
          description: true, // Solução proposta
          problem: true, // Problema identificado
          contribution: true,
          dateRef: true,
          impact: true,
          capacity: true,
          effort: true,
          finalScore: true,
          finalClassification: true,
          status: true,
          rejectionReason: true,
          analystId: true,
          payment: true,
          paymentDate: true,
          editHistory: true,
          isTextEdited: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              setor: true,
            },
          },
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })
    }),

  // Kanban
  listKanban: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.suggestion.findMany({
      orderBy: { createdAt: "desc" },
        select: {
          id: true,
          ideaNumber: true,
          description: true, // Solução proposta
          problem: true, // Problema identificado
          submittedName: true,
          status: true,
          isTextEdited: true,
          createdAt: true,
        },
      })
    }),

  // Atualizações do admin (impact/capacity/effort/kpis/status/reason/analyst)
  updateAdmin: adminProcedure
    .input(z.object({
      id: z.string(),
      impact: ScoreItem.optional(),
      capacity: ScoreItem.optional(),
      effort: ScoreItem.optional(),
      kpis: z.array(z.string()).optional(),
      status: StatusEnum.optional(),
      rejectionReason: z.string().optional(),
      analystId: z.string().optional(),
      payment: z.object({
        status: z.enum(["paid", "unpaid"]),
        amount: z.number().optional(),
        description: z.string().optional(),
      }).optional(),
      paymentDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const prev = await ctx.db.suggestion.findUnique({
        where: { id: input.id },
        select: { impact: true, capacity: true, effort: true },
      })

      const prevImpact = prev?.impact as unknown as { score?: number; text?: string } | null
      const prevCapacity = prev?.capacity as unknown as { score?: number; text?: string } | null
      const prevEffort = prev?.effort as unknown as { score?: number; text?: string } | null

      const impactScore = input.impact?.score ?? prevImpact?.score ?? null
      const capacityScore = input.capacity?.score ?? prevCapacity?.score ?? null
      const effortScore = input.effort?.score ?? prevEffort?.score ?? null

      const finalScore =
        [impactScore, capacityScore, effortScore].every((v) => typeof v === "number")
          ? (impactScore! + capacityScore! - effortScore!)
          : null

      const finalClassification =
        typeof finalScore === "number"
          ? (finalScore >= 15
              ? { label: "Aprovar para Gestores", range: "15-20" }
              : finalScore >= 10
                ? { label: "Ajustar e incubar", range: "10-14" }
                : { label: "Descartar com justificativa clara", range: "0-9" })
          : null

      // Buscar dados da ideia e usuário antes da atualização
      const suggestionData = await ctx.db.suggestion.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      if (!suggestionData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ideia não encontrada"
        })
      }

      // Executar a atualização
      const updatedSuggestion = await ctx.db.suggestion.update({
        where: { id: input.id },
        data: {
          impact: (input.impact ?? prevImpact ?? null) as InputJsonValue,
          capacity: (input.capacity ?? prevCapacity ?? null) as InputJsonValue,
          effort: (input.effort ?? prevEffort ?? null) as InputJsonValue,
          kpis: (input.kpis ?? null) as InputJsonValue,
          status: input.status,
          rejectionReason: input.rejectionReason,
          analystId: input.analystId, // Usar apenas o analystId fornecido explicitamente
          payment: input.payment ? (input.payment as Prisma.InputJsonValue) : undefined,
          paymentDate: input.paymentDate,
          finalScore,
          finalClassification: finalClassification as InputJsonValue,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      // Criar notificações baseadas nas mudanças
      try {
        // Notificação de atualização da ideia
        if (input.status && input.status !== suggestionData.status) {
          let notificationTitle = ""
          let notificationMessage = ""
          let notificationType: "SUGGESTION_APPROVED" | "SUGGESTION_REJECTED" | "SUGGESTION_UPDATED" = "SUGGESTION_UPDATED"

          switch (input.status) {
            case "APPROVED":
              notificationTitle = "Ideia Aprovada! 🎉"
              notificationMessage = `Parabéns! Sua ideia #${suggestionData.ideaNumber} foi aprovada.`
              notificationType = "SUGGESTION_APPROVED"
              break
            case "NOT_IMPLEMENTED":
              notificationTitle = "Ideia Rejeitada"
              notificationMessage = `Sua ideia #${suggestionData.ideaNumber} foi rejeitada.${input.rejectionReason ? ` Motivo: ${input.rejectionReason}` : ''}`
              notificationType = "SUGGESTION_REJECTED"
              break
            default:
              notificationTitle = "Ideia Atualizada"
              const statusMapping = {
                "NEW": "Nova",
                "IN_REVIEW": "Em avaliação",
                "APPROVED": "Aprovada",
                "IN_PROGRESS": "Em execução",
                "DONE": "Concluída",
                "NOT_IMPLEMENTED": "Não implementada"
              }
              notificationMessage = `A ideia #${suggestionData.ideaNumber} foi atualizada para "${statusMapping[input.status] || input.status}".`
              notificationType = "SUGGESTION_UPDATED"
          }

          await ctx.db.notification.create({
            data: {
              title: notificationTitle,
              message: notificationMessage,
              type: notificationType,
              channel: "IN_APP",
              userId: suggestionData.userId,
              entityId: input.id,
              entityType: "suggestion",
              actionUrl: `/my-suggestions`
            }
          })
        } else if (input.impact || input.capacity || input.effort) {
          // Notificação de atualização de classificação da ideia
          await ctx.db.notification.create({
            data: {
              title: "Classificação Atualizada",
              message: `A classificação da ideia #${suggestionData.ideaNumber} foi atualizada.`,
              type: "CLASSIFICATION_UPDATED",
              channel: "IN_APP",
              userId: suggestionData.userId,
              entityId: input.id,
              entityType: "suggestion",
              actionUrl: `/my-suggestions`
            }
          })
        }
      } catch (notificationError) {
        // Não falhar a operação principal se a notificação falhar
        console.error("Erro ao criar notificação:", notificationError)
      }

      // Enviar email de notificação se o status foi alterado
      if (input.status && input.status !== suggestionData.status) {
        if (input.status === "NOT_IMPLEMENTED" && !input.rejectionReason) {
        } else {
          try {
            const nomeUsuario = suggestionData.user ? `${suggestionData.user.firstName ?? ''} ${suggestionData.user.lastName ?? ''}`.trim() || 'Usuário' : 'Usuário'
            let nomeResponsavel = 'Admin'
            if (updatedSuggestion.analyst && typeof updatedSuggestion.analyst === 'object') {
              interface AnalystData {
                firstName?: string | null
                lastName?: string | null
                email?: string | null
              }
              const analystObj = updatedSuggestion.analyst as AnalystData
              if (analystObj) {
                const firstName = analystObj.firstName ?? ''
                const lastName = analystObj.lastName ?? ''
                const fullName = `${firstName} ${lastName}`.trim()
                if (fullName) {
                  nomeResponsavel = fullName
                }
              }
            }

            // Mapear status para português
            const statusMapping = {
              "NEW": "Nova",
              "IN_REVIEW": "Em avaliação",
              "APPROVED": "Em orçamento",
              "IN_PROGRESS": "Em execução",
              "DONE": "Concluída",
              "NOT_IMPLEMENTED": "Não implementada"
            }

            const statusPortugues = statusMapping[input.status] || input.status

            // Enviar email apenas para o usuário que criou a ideia
            await sendEmail(
              suggestionData.user.email,
              `Atualização da Ideia #${suggestionData.ideaNumber}`,
              mockEmailNotificacaoSugestao(
                nomeUsuario,
                nomeResponsavel,
                suggestionData.ideaNumber,
                statusPortugues,
                input.rejectionReason
              )
            )

          } catch (emailError) {
            console.error("Erro ao enviar email de notificação:", emailError)
            // Não falhar a operação se o email não puder ser enviado
          }
        }
      }

      return updatedSuggestion
    }),

  // Editar descrição quando status é NEW (Não avaliado)
  updateDescription: protectedProcedure
    .input(z.object({
      id: z.string(),
      description: z.string().trim().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validar edição
      const suggestion = await validateSuggestionEdit(ctx.db, input.id, ctx.auth.userId)

      // Se a descrição não mudou, não fazer nada
      if (suggestion.description === input.description) {
        return await ctx.db.suggestion.findUnique({
          where: { id: input.id },
        })
      }

      // Atualizar histórico de edições
      const editHistory = updateEditHistory(suggestion.editHistory, "description", suggestion.description)

      // Atualizar a ideia
      const updatedSuggestion = await ctx.db.suggestion.update({
        where: { id: input.id },
        data: {
          description: input.description,
          editHistory: editHistory as InputJsonValue,
          isTextEdited: true,
        },
      })

      return updatedSuggestion
    }),

  // Editar problema quando status é NEW (Não avaliado)
  updateProblem: protectedProcedure
    .input(z.object({
      id: z.string(),
      problem: z.string().trim().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validar edição
      const suggestion = await validateSuggestionEdit(ctx.db, input.id, ctx.auth.userId)

      const newProblem = input.problem ?? null
      
      // Se o problema não mudou, não fazer nada
      if (suggestion.problem === newProblem) {
        return await ctx.db.suggestion.findUnique({
          where: { id: input.id },
        })
      }

      // Atualizar histórico de edições
      const editHistory = updateEditHistory(suggestion.editHistory, "problem", suggestion.problem)

      // Atualizar a ideia
      const updatedSuggestion = await ctx.db.suggestion.update({
        where: { id: input.id },
        data: {
          problem: newProblem,
          editHistory: editHistory as InputJsonValue,
          isTextEdited: true,
        },
      })

      return updatedSuggestion
    }),

  // Buscar ideias do usuário logado
  getMySuggestions: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.suggestion.findMany({
        where: {
          userId: ctx.auth.userId,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          ideaNumber: true,
          submittedName: true,
          submittedSector: true,
          isNameVisible: true,
          description: true, // Solução proposta
          problem: true, // Problema identificado
          contribution: true,
          dateRef: true,
          impact: true,
          capacity: true,
          effort: true,
          finalScore: true,
          finalClassification: true,
          status: true,
          rejectionReason: true,
          analystId: true,
          payment: true,
          paymentDate: true,
          editHistory: true,
          isTextEdited: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              setor: true,
            },
          },
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })
    }),

  // Enviar notificação por email quando motivo for salvo
  sendRejectionNotification: adminProcedure
    .input(z.object({
      suggestionId: z.string(),
      rejectionReason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Buscar dados da ideia e usuário
      const suggestionData = await ctx.db.suggestion.findUnique({
        where: { id: input.suggestionId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      if (!suggestionData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ideia não encontrada"
        })
      }

      if (suggestionData.status !== "NOT_IMPLEMENTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta ideia não está marcada como 'Não implementada'"
        })
      }

      try {
        const nomeUsuario = `${suggestionData.user.firstName ?? ''} ${suggestionData.user.lastName ?? ''}`.trim() ?? 'Usuário'
        const nomeResponsavel = `${suggestionData.analyst?.firstName ?? ''} ${suggestionData.analyst?.lastName ?? ''}`.trim() ?? 'Admin'

        // Enviar email apenas para o usuário que criou a ideia
        await sendEmail(
          suggestionData.user.email,
          `Atualização da Ideia #${suggestionData.ideaNumber}`,
          mockEmailNotificacaoSugestao(
            nomeUsuario,
            nomeResponsavel,
            suggestionData.ideaNumber,
            "Não implementada",
            input.rejectionReason
          )
          // Removido CC para o admin - apenas notificação para o usuário
        )

        return { success: true, message: "Notificação enviada com sucesso" }
      } catch (emailError) {
        console.error("Erro ao enviar email de rejeição:", emailError)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao enviar notificação por email"
        })
      }
    }),

  // Estatísticas para dashboard
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      // Contar ideias totais
      const totalSuggestions = await ctx.db.suggestion.count()

      // Última ideia criada
      const latestSuggestion = await ctx.db.suggestion.findFirst({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })

      // Ideias criadas hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todaySuggestions = await ctx.db.suggestion.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })

      return {
        total: totalSuggestions,
        today: todaySuggestions,
        latest: latestSuggestion ? {
          createdAt: latestSuggestion.createdAt,
          user: latestSuggestion.user
        } : null
      }
    }),
})
