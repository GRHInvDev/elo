import { db } from "@/server/db"
import { NextResponse } from "next/server"
import { addHours, isAfter, isBefore, subHours } from "date-fns"

export async function GET() {
  console.log("| CRONJOB | Executando sistema de notificações automáticas...")

  const processNotifications = async () => {
    try {
      const now = new Date()

      // 1. Notificações para agendamentos próximos (1 hora antes)
      console.log("| CRONJOB | Verificando agendamentos próximos...")
      const upcomingBookings = await db.booking.findMany({
        where: {
          start: {
            gte: now,
            lte: addHours(now, 1), // Próximos 60 minutos
          }
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          room: {
            select: {
              name: true
            }
          }
        }
      })

      for (const booking of upcomingBookings) {
        // Verificar se já não existe uma notificação para este agendamento
        const existingNotification = await db.notification.findFirst({
          where: {
            entityId: booking.id,
            entityType: "booking",
            userId: booking.userId,
            createdAt: {
              gte: subHours(now, 2) // Últimas 2 horas
            }
          }
        })

        if (!existingNotification) {
          await db.notification.create({
            data: {
              title: "Agendamento Próximo",
              message: `Seu agendamento na sala "${booking.room.name}" começa em menos de 1 hora.`,
              type: "WARNING",
              channel: "IN_APP",
              userId: booking.userId,
              entityId: booking.id,
              entityType: "booking",
              actionUrl: `/rooms`
            }
          })
          console.log(`| CRONJOB | Notificação criada para agendamento: ${booking.title}`)
        }
      }

      // 2. Notificações para pedidos de comida próximos ao fechamento (1 hora antes do fechamento)
      console.log("| CRONJOB | Verificando pedidos próximos ao fechamento...")

      // Assumindo que os pedidos fecham às 10:00 (ajuste conforme necessário)
      const cutoffTime = new Date()
      cutoffTime.setHours(10, 0, 0, 0)

      if (isBefore(now, cutoffTime) && isAfter(now, subHours(cutoffTime, 1))) {
        const pendingOrders = await db.foodOrder.findMany({
          where: {
            status: "PENDING",
            orderDate: new Date() // Hoje
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        })

        // Notificar usuários com pedidos pendentes
        const usersWithPendingOrders = [...new Set(pendingOrders.map(order => order.userId))]

        for (const userId of usersWithPendingOrders) {
          // Verificar se já não existe uma notificação recente
          const existingNotification = await db.notification.findFirst({
            where: {
              entityType: "food_order_reminder",
              userId: userId,
              createdAt: {
                gte: subHours(now, 1) // Última 1 hora
              }
            }
          })

          if (!existingNotification) {
            await db.notification.create({
              data: {
                title: "Pedidos de Hoje",
                message: "Lembrete: Os pedidos de hoje fecham em menos de 1 hora. Verifique se seu pedido está correto.",
                type: "WARNING",
                channel: "IN_APP",
                userId: userId,
                entityType: "food_order_reminder",
                actionUrl: `/food`
              }
            })
          }
        }

        console.log(`| CRONJOB | Notificações de fechamento enviadas para ${usersWithPendingOrders.length} usuários`)
      }

      // 3. Notificações para aniversários próximos (1 dia antes)
      console.log("| CRONJOB | Verificando aniversários próximos...")
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const upcomingBirthdays = await db.birthday.findMany({
        where: {
          data: {
            gte: tomorrow,
            lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
          }
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })

      for (const birthday of upcomingBirthdays) {
        // Notificar todos os usuários sobre o aniversário
        const allUsers = await db.user.findMany({
          select: { id: true }
        })

        for (const user of allUsers) {
          // Verificar se já não existe uma notificação recente
          const existingNotification = await db.notification.findFirst({
            where: {
              entityId: birthday.id,
              entityType: "birthday",
              userId: user.id,
              createdAt: {
                gte: subHours(now, 24) // Últimas 24 horas
              }
            }
          })

          if (!existingNotification) {
            await db.notification.create({
              data: {
                title: "Aniversário Amanhã! 🎂",
                message: `Amanhã é o aniversário de ${birthday.user?.firstName ?? birthday.name}!`,
                type: "SUCCESS",
                channel: "IN_APP",
                userId: user.id,
                entityId: birthday.id,
                entityType: "birthday",
                actionUrl: `/birthdays`
              }
            })
          }
        }
        console.log(`| CRONJOB | Notificações de aniversário criadas para ${birthday.user?.firstName ?? birthday.name}`)
      }

      console.log("| CRONJOB | Sistema de notificações automáticas concluído")
    } catch (err) {
      console.error("| CRONJOB | Erro no sistema de notificações automáticas:", err)
    }
  }

  void processNotifications()
  return NextResponse.json({
    message: "Sistema de notificações executado",
    timestamp: new Date().toISOString()
  })
}
