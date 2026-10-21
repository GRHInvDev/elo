import { PrismaClient } from "@prisma/client";

import { env } from "@/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// Em ambiente de desenvolvimento, se um novo model foi gerado no Prisma Client (ex: dashboardVideo),
// descarta a instância antiga em cache no globalThis para pegar o client recém-gerado.
if (globalForPrisma.prisma && !("dashboardVideo" in (globalForPrisma.prisma as unknown as Record<string, unknown>))) {
  globalForPrisma.prisma = undefined;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
