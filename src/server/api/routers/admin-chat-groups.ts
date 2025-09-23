import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, adminProcedure } from "../trpc"
import type { Prisma } from "@prisma/client"

const createGroupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().optional(),
  memberIds: z.array(z.string()).min(1, "Selecione pelo menos um membro"),
})

const updateGroupSchema = createGroupSchema.extend({
  id: z.string(),
})

const addMembersSchema = z.object({
  groupId: z.string(),
  memberIds: z.array(z.string()).min(1, "Selecione pelo menos um membro"),
})

const removeMemberSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
})

export const adminChatGroupsRouter = createTRPCRouter({
  // Criar um novo grupo
  createGroup: adminProcedure
    .input(createGroupSchema)
    .mutation(async ({ ctx, input }) => {
      const { memberIds } = input
      const createdById = ctx.auth.userId

      // Criar o grupo
      const group = await ctx.db.chat_group.create({
        data: {
          name: input.name,
          description: input.description,
          createdBy: {
            connect: {
              id: createdById,
            },
          },
        },
      })
      
      // Adicionar membros ao grupo
      const memberInserts = memberIds.map(memberId => ({
        groupId: group.id,
        userId: memberId,
        addedById: createdById,
      }))

      await ctx.db.chat_group_member.createMany({
        data: memberInserts,
      })

      // Retornar grupo com membros
      return ctx.db.chat_group.findUnique({
        where: { id: group.id },
        include: {
          members: {
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
              addedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    }),

  // Atualizar grupo
  updateGroup: adminProcedure
    .input(updateGroupSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, name, description, memberIds } = input

      // Verificar se o grupo existe
      const existingGroup = await ctx.db.chat_group.findUnique({
        where: { id },
        include: { members: true },
      })

      if (!existingGroup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupo não encontrado"
        })
      }

      // Atualizar o grupo
      await ctx.db.chat_group.update({
        where: { id },
        data: {
          name,
          description,
        },
      })

      // Gerenciar membros
      const currentMemberIds = existingGroup.members.map(m => m.userId)
      const membersToAdd = memberIds.filter(id => !currentMemberIds.includes(id))
      const membersToRemove = currentMemberIds.filter(id => !memberIds.includes(id))

      // Adicionar novos membros
      if (membersToAdd.length > 0) {
        const memberInserts = membersToAdd.map(memberId => ({
          groupId: id,
          userId: memberId,
          addedById: ctx.auth.userId,
        }))

        await ctx.db.chat_group_member.createMany({
          data: memberInserts,
        })
      }

      // Remover membros
      if (membersToRemove.length > 0) {
        await ctx.db.chat_group_member.deleteMany({
          where: {
            groupId: id,
            userId: { in: membersToRemove },
          },
        })
      }

      // Retornar grupo atualizado
      return ctx.db.chat_group.findUnique({
        where: { id },
        include: {
          members: {
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
              addedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    }),

  // Deletar grupo
  deleteGroup: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input

      // Verificar se o grupo existe
      const group = await ctx.db.chat_group.findUnique({
        where: { id },
      })

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupo não encontrado"
        })
      }

      // Deletar o grupo (cascade irá deletar membros e mensagens)
      await ctx.db.chat_group.delete({
        where: { id },
      })

      return { success: true }
    }),

  // Listar todos os grupos
  getGroups: adminProcedure
    .query(async ({ ctx }) => {
      return ctx.db.chat_group.findMany({
        where: { isActive: true },
        include: {
          members: {
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
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              members: true,
              messages: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  // Buscar grupo específico
  getGroup: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input

      const group = await ctx.db.chat_group.findUnique({
        where: { id },
        include: {
          members: {
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
              addedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      })

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupo não encontrado"
        })
      }

      return group
    }),

  // Adicionar membros a um grupo
  addMembers: adminProcedure
    .input(addMembersSchema)
    .mutation(async ({ ctx, input }) => {
      const { groupId, memberIds } = input

      // Verificar se o grupo existe
      const group = await ctx.db.chat_group.findUnique({
        where: { id: groupId },
      })

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupo não encontrado"
        })
      }

      // Verificar membros existentes para evitar duplicatas
      const existingMembers = await ctx.db.chat_group_member.findMany({
        where: {
          groupId,
          userId: { in: memberIds },
        },
        select: { userId: true },
      })

      const existingMemberIds = existingMembers.map(m => m.userId)
      const membersToAdd = memberIds.filter(id => !existingMemberIds.includes(id))

      if (membersToAdd.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Todos os usuários selecionados já são membros do grupo"
        })
      }

      // Adicionar novos membros
      const memberInserts = membersToAdd.map(memberId => ({
        groupId,
        userId: memberId,
        addedById: ctx.auth.userId,
      }))

      await ctx.db.chat_group_member.createMany({
        data: memberInserts,
      })

      return { added: membersToAdd.length }
    }),

  // Remover membro do grupo
  removeMember: adminProcedure
    .input(removeMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const { groupId, userId } = input

      const deleted = await ctx.db.chat_group_member.deleteMany({
        where: {
          groupId,
          userId,
        },
      })

      if (deleted.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Membro não encontrado no grupo"
        })
      }

      return { success: true }
    }),

  // Buscar usuários disponíveis para adicionar a grupos
  getAvailableUsers: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      excludeGroupId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { search, excludeGroupId } = input

      const where: Prisma.UserWhereInput = {
        role_config: {
          // Excluir usuários TOTEM
          path: ['isTotem'],
          equals: false,
        },
      }

      // Se especificado um grupo, excluir usuários que já são membros
      if (excludeGroupId) {
        const existingMembers = await ctx.db.chat_group_member.findMany({
          where: { groupId: excludeGroupId },
          select: { userId: true },
        })

        const memberIds = existingMembers.map(m => m.userId)
        where.id = { notIn: memberIds }
      }

      // Filtro de busca
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ]
      }

      return ctx.db.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          enterprise: true,
          setor: true,
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ]
      })
    }),
})
