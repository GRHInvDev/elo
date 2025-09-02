import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";
import { cache } from "react";

import type { AppRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);

// Lazy initialization com tipos corretos
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let callerInstance: ReturnType<typeof import("@/server/api/root").createCaller> | null = null;

const getCaller = async () => {
  if (!callerInstance) {
    // Dynamic import para evitar dependência circular
    const { createCaller } = await import("@/server/api/root");
    const context = await createContext();
    callerInstance = createCaller(context);
  }
  return callerInstance;
};

// Criar um caller proxy que resolve dinamicamente
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const createCallerProxy = (): ReturnType<typeof import("@/server/api/root").createCaller> => {
  const handler: ProxyHandler<object> = {
    get(target, prop) {
      if (typeof prop !== 'string') {
        return undefined;
      }
      
      // Retorna um proxy para o router específico
      return new Proxy({}, {
        get(routerTarget, routerProp) {
          if (typeof routerProp !== 'string') {
            return undefined;
          }
          
          // Retorna a função que chama o método correto
          return async (...args: unknown[]) => {
            const caller = await getCaller();
            const router = (caller as Record<string, unknown>)[prop];
            
            if (router && typeof router === 'object') {
              const method = (router as Record<string, unknown>)[routerProp];
              if (typeof method === 'function') {
                return method.apply(router, args) as unknown;
              }
            }
            
            throw new Error(`Method ${prop}.${routerProp} not found`);
          };
        }
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  return new Proxy({}, handler) as ReturnType<typeof import("@/server/api/root").createCaller>;
};

const caller = createCallerProxy();

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient
);