import "server-only";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { cache } from "react";
import { headers } from "next/headers";

const createServerCaller = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  const context = await createTRPCContext({
    headers: heads,
  });

  return createCaller(context);
});

export const api = {
  user: {
    me: async () => {
      const caller = await createServerCaller();
      return caller.user.me();
    },
    listForChat: async (input: { search?: string }) => {
      const caller = await createServerCaller();
      return caller.user.listForChat(input);
    },
  },
  vehicleRent: {
    getMyActiveRent: async () => {
      const caller = await createServerCaller();
      return caller.vehicleRent.getMyActiveRent();
    },
    create: async (input: {
      destiny: string;
      driver: string;
      possibleEnd: Date;
      vehicleId: string;
      startDate: Date;
      passangers?: string;
    }) => {
      const caller = await createServerCaller();
      return caller.vehicleRent.create(input);
    }
  },
  vehicle: {
    getAll: async (input?: {
      limit?: number;
      cursor?: string;
      enterprise?: "NA" | "Box" | "RHenz" | "Cristallux";
      availble?: boolean;
    }) => {
      const caller = await createServerCaller();
      return caller.vehicle.getAll(input ?? {});
    },
    getAvailable: async (input: { startDate: Date; endDate: Date }) => {
      const caller = await createServerCaller();
      return caller.vehicle.getAvailable(input);
    },
    getById: async (id: string) => {
      const caller = await createServerCaller();
      return caller.vehicle.getById({ id });
    }
  },
  form: {
    list: async () => {
      const caller = await createServerCaller();
      return caller.form.list();
    },
    getById: async (id: string) => {
      const caller = await createServerCaller();
      return caller.form.getById({ id });
    },
  },
  formResponse: {
    create: async (input: { formId: string; responses: Array<Record<string, unknown>> }) => {
      const caller = await createServerCaller();
      return caller.formResponse.create(input);
    },
    getById: async (responseId: string) => {
      const caller = await createServerCaller();
      return caller.formResponse.getById({ responseId });
    },
    listByForm: async (input: {
      formId: string;
      startDate?: Date;
      endDate?: Date;
      priority?: "ASC" | "DESC";
      userIds?: string[];
      setores?: string[];
      hasResponse?: boolean;
      take?: number;
      skip?: number;
    }) => {
      const caller = await createServerCaller();
      return caller.formResponse.listByForm(input);
    }
  },
  booking: {
    create: async (input: {
      roomId: string;
      title: string;
      start: Date;
      end: Date;
    }) => {
      const caller = await createServerCaller();
      return caller.booking.create(input);
    },
    list: async (input: {
      startDate: Date;
      endDate: Date;
    }) => {
      const caller = await createServerCaller();
      return caller.booking.list(input);
    },
    listMine: async () => {
      const caller = await createServerCaller();
      return caller.booking.listMine();
    },
    listMineForDay: async (input?: { date?: Date }) => {
      const caller = await createServerCaller();
      return caller.booking.listMineForDay(input ?? {});
    },
    delete: async (input: { id: string }) => {
      const caller = await createServerCaller();
      return caller.booking.delete(input);
    }
  },
  room: {
    list: async (input?: {
      floor?: number;
      filial?: string;
    }) => {
      const caller = await createServerCaller();
      return caller.room.list(input);
    },
    listAvailable: async (input: {
      date: Date;
      filial?: string;
    }) => {
      const caller = await createServerCaller();
      return caller.room.listAvailable(input);
    },
    byId: async (input: { id: string }) => {
      const caller = await createServerCaller();
      return caller.room.byId(input);
    },
    checkAvailability: async (input: {
      roomId: string;
      start: Date;
      end: Date;
    }) => {
      const caller = await createServerCaller();
      return caller.room.checkAvailability(input);
    }
  },
  product: {
    getAll: async () => {
      const caller = await createServerCaller();
      return caller.product.getAll();
    },
  },
  restaurant: {
    list: async (input?: { city?: string; active?: boolean }) => {
      const caller = await createServerCaller();
      return caller.restaurant.list(input);
    },
  },
  menuItem: {
    byRestaurant: async (input: {
      restaurantId: string;
      date?: Date;
      includeUnavailable?: boolean;
    }) => {
      const caller = await createServerCaller();
      return caller.menuItem.byRestaurant(input);
    },
  },
  aiAssistant: {
    notifyColleague: async (input: { targetUserId: string; message: string }) => {
      const caller = await createServerCaller();
      return caller.aiAssistant.notifyColleague(input);
    },
  },
  foodOrder: {
    create: async (input: {
      restaurantId: string;
      menuItemId: string;
      orderDate: Date;
      observations?: string;
      optionChoices?: string[];
    }) => {
      const caller = await createServerCaller();
      return caller.foodOrder.create(input);
    },
    myOrders: async (input?: {
      startDate?: Date;
      endDate?: Date;
      status?: "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";
    }) => {
      const caller = await createServerCaller();
      return caller.foodOrder.myOrders(input);
    },
  },
  suggestion: {
    getMySuggestions: async () => {
      const caller = await createServerCaller();
      return caller.suggestion.getMySuggestions();
    },
    create: async (input: {
      submittedName?: string;
      submittedSector?: string;
      description: string;
      problem?: string;
      contribution: {
        type: "IDEIA_INOVADORA" | "SUGESTAO_MELHORIA" | "SOLUCAO_PROBLEMA" | "OUTRO";
        other?: string;
      };
    }) => {
      const caller = await createServerCaller();
      return caller.suggestion.create(input);
    },
  },
};