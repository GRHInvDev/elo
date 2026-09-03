import { createHash } from "crypto";

/**
 * Calcula o hash SHA-256 de um buffer para deduplicação e integridade
 */
export function computeSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Converte um buffer para string base64 com Data URI
 */
export function bufferToDataUri(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

/**
 * Resolve a URL de exibição de uma imagem baseando-se na configuração do sistema
 * Se USE_NEON_STORAGE estiver ativado e existir um ID de arquivo no Neon, serve /api/files/[id]
 */
export function resolveImageUrl(
  originalUrl?: string | null,
  storedFileId?: string | null
): string {
  if (!originalUrl && !storedFileId) {
    return "";
  }

  // Se já for uma URL local (/public) ou inline base64
  if (originalUrl?.startsWith("/") || originalUrl?.startsWith("data:image")) {
    return originalUrl;
  }

  const useNeon = process.env.NEXT_PUBLIC_USE_NEON_STORAGE === "true";

  if (useNeon && storedFileId) {
    return `/api/files/${storedFileId}`;
  }

  return originalUrl ?? (storedFileId ? `/api/files/${storedFileId}` : "");
}
