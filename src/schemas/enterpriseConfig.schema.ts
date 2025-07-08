import { z } from "zod";
import { Enterprise } from "@prisma/client";

export const upsertEnterpriseConfigSchema = z.object({
    enterprise: z.nativeEnum(Enterprise),
    shopNotificationEmail: z.string().email("Email inválido"),
}); 