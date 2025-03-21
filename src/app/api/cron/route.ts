/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { db } from '@/server/db';
import { NextResponse } from 'next/server';
import cron from "node-cron";

cron.schedule("36 15 * * *", () => {
    console.log("Executando limpeza de eventos...");
    try {
      const res = async () => await db.event.deleteMany({
        where: {
            endDate: {
                lt: new Date()
            }
        }
      });
      void res()
      console.log(`Eventos deletados`);
    } catch (err) {
      console.error("Erro ao deletar eventos:", err);
    }
});

export async function GET() {
    return NextResponse.json({ message: "Cronjob rodando", tasks: cron.getTasks()});
}