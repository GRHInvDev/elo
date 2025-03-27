/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { db } from '@/server/db';
import { NextResponse } from 'next/server';
import cron from "node-cron";

cron.schedule("0 0 * * *", () => {
    console.log("| CRONJOB | Executando limpeza de eventos...");
    try {
      const res = async () => await db.event.deleteMany({
        where: {
            endDate: {
                lt: new Date()
            }
        }
      });
      void res()
      console.log(`| CRONJOB | Eventos deletados`);
    } catch (err) {
      console.error("Erro ao deletar eventos:", err);
    }
});

cron.schedule("0 * * * *", () => {
  console.log("| CRONJOB | Executando update de veículos...");
  try {
    const res = async () => await db.vehicle.updateMany({
      data: {
        availble: true
      },
      where: {
          availble: false,
          rents: {
            some: {
              AND: [
                {
                  startDate: {
                    lte: new Date(),
                  },
                  OR: [
                    {
                      possibleEnd: {
                        gte: new Date(),
                      }
                    },
                    {
                      endDate: {
                        gte: new Date(),
                      }
                    },
                  ]
                }
              ]
            }
          }
      }
    });
    void res()
    console.log(`| CRONJOB | Carros disponibilizados`);
  } catch (err) {
    console.error("| CRONJOB | Erro ao disponibilizar veículos:", err);
  }
});

export async function GET() {
    return NextResponse.json({ message: "Cronjob rodando", tasks: cron.getTasks()});
}