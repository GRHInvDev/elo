import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { computeSha256 } from "@/lib/storage-helpers";

export const fileRouter = createTRPCRouter({

  upload: protectedProcedure
    .input(
      z.object({
        base64Data: z.string().min(1, "Conteúdo base64 é obrigatório"),
        fileName: z.string().default("arquivo"),
        mimeType: z.string().default("application/octet-stream"),
        entityType: z.string().default("GENERAL"),
        entityId: z.string().optional(),
        entityField: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        let cleanBase64 = input.base64Data;
        let detectedMime = input.mimeType;

        if (input.base64Data.startsWith("data:")) {
          const match = /^data:([^;]+);base64,(.*)$/.exec(input.base64Data);
          if (match) {
            detectedMime = match[1] ?? detectedMime;
            cleanBase64 = match[2] ?? "";
          }
        }

        const buffer = Buffer.from(cleanBase64, "base64");
        const fileSize = buffer.length;

        if (fileSize > 5 * 1024 * 1024) {
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "O arquivo excede o limite máximo permitido de 5MB.",
          });
        }

        const fileHash = computeSha256(buffer);
        const fullBase64Data = `data:${detectedMime};base64,${cleanBase64}`;

        const storedFile = await ctx.db.storedFile.create({
          data: {
            entityType: input.entityType,
            entityId: input.entityId,
            entityField: input.entityField,
            fileName: input.fileName,
            mimeType: detectedMime,
            fileSize: fileSize,
            fileHash: fileHash,
            base64Data: fullBase64Data,
            migrationStatus: "MIGRATED",
            isActive: true,
            attempts: 1,
            lastAttemptAt: new Date(),
          },
        });

        return {
          id: storedFile.id,
          url: `/api/files/${storedFile.id}`,
          fileHash: storedFile.fileHash,
          fileName: storedFile.fileName,
          fileSize: storedFile.fileSize,
          mimeType: storedFile.mimeType,
        };
      } catch (err: unknown) {
        if (err instanceof TRPCError) throw err;
        console.error("[fileRouter.upload] Erro ao gravar arquivo:", err);
        const errMsg = err instanceof Error ? err.message : "Erro ao salvar arquivo no banco de dados.";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errMsg,
        });
      }
    }),

  uploadMultiple: protectedProcedure
    .input(
      z.object({
        files: z.array(
          z.object({
            base64Data: z.string().min(1),
            fileName: z.string().default("arquivo"),
            mimeType: z.string().default("image/jpeg"),
          })
        ),
        entityType: z.string().default("GENERAL"),
        entityId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = [];
      for (const item of input.files) {
        let cleanBase64 = item.base64Data;
        let detectedMime = item.mimeType;

        if (item.base64Data.startsWith("data:")) {
          const match = /^data:([^;]+);base64,(.*)$/.exec(item.base64Data);
          if (match) {
            detectedMime = match[1] ?? detectedMime;
            cleanBase64 = match[2] ?? "";
          }
        }

        const buffer = Buffer.from(cleanBase64, "base64");
        const fileHash = computeSha256(buffer);
        const fullBase64Data = `data:${detectedMime};base64,${cleanBase64}`;

        const storedFile = await ctx.db.storedFile.create({
          data: {
            entityType: input.entityType,
            entityId: input.entityId,
            fileName: item.fileName,
            mimeType: detectedMime,
            fileSize: buffer.length,
            fileHash: fileHash,
            base64Data: fullBase64Data,
            migrationStatus: "MIGRATED",
            isActive: true,
            attempts: 1,
            lastAttemptAt: new Date(),
          },
        });

        results.push({
          id: storedFile.id,
          url: `/api/files/${storedFile.id}`,
          fileHash: storedFile.fileHash,
          fileName: storedFile.fileName,
          fileSize: storedFile.fileSize,
          mimeType: storedFile.mimeType,
        });
      }
      return results;
    }),

  delete: protectedProcedure
    .input(z.object({ idOrUrl: z.string() }))
    .mutation(async ({ ctx, input }) => {
      let fileId = input.idOrUrl;
      if (fileId.startsWith("/api/files/")) {
        fileId = fileId.replace("/api/files/", "");
      }

      await ctx.db.storedFile.updateMany({
        where: {
          OR: [{ id: fileId }, { legacyUrl: input.idOrUrl }],
        },
        data: { isActive: false },
      });

      return { success: true };
    }),

  getMetadata: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const file = await ctx.db.storedFile.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          fileSize: true,
          fileHash: true,
          entityType: true,
          entityId: true,
          createdAt: true,
        },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Arquivo não encontrado",
        });
      }

      return file;
    }),
});