import "server-only";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { cache } from "react";
import { headers } from "next/headers";
import type { NotificationType, NotificationChannel } from "@prisma/client";

// Simplified server-side caller for RSC
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
    }
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
    getById: async (responseId: string) => {
      const caller = await createServerCaller();
      return caller.formResponse.getById({ responseId });
    },
    listByForm: async (formId: string) => {
      const caller = await createServerCaller();
      return caller.formResponse.listByForm({ formId });
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
  notification: {
    create: async (data: {
      title: string;
      message: string;
      userId: string;
      type?: NotificationType;
      channel?: NotificationChannel;
      entityId?: string;
      entityType?: string;
      actionUrl?: string;
    }) => {
      const caller = await createServerCaller();
      return caller.notification.create(data);
    },
    createBulk: async (data: {
      title: string;
      message: string;
      userIds: string[];
      notifications: {
        title: string;
        message: string;
        userId: string;
        type?: NotificationType;
        channel?: NotificationChannel;
        entityType?: string;
      }[];
    }) => {
      const caller = await createServerCaller();
      return caller.notification.createBulk(data);
    }
  }
};