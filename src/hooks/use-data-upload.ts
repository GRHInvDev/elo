"use client";

import { useState, useCallback } from "react";
import { api } from "@/trpc/react";

export interface UploadedFileResult {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  ufsUrl?: string;
}

interface UseDataUploadOptions {
  entityType?: string;
  entityId?: string;
  entityField?: string;
  maxFileSizeMB?: number;
  onClientUploadComplete?: (files: UploadedFileResult[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadBegin?: (fileName: string) => void;
}

export function useDataUpload(options: UseDataUploadOptions = {}) {
  const {
    entityType = "GENERAL",
    entityId,
    entityField,
    maxFileSizeMB = 16,
    onClientUploadComplete,
    onUploadError,
    onUploadBegin,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadMutation = api.file.upload.useMutation();
  const uploadMultipleMutation = api.file.uploadMultiple.useMutation();

  const readFileAsDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Erro ao ler dados do arquivo."));
      reader.readAsDataURL(file);
    });
  }, []);

  const startUpload = useCallback(
    async (files: File[]): Promise<UploadedFileResult[]> => {
      if (!files || files.length === 0) return [];

      setIsUploading(true);
      setProgress(10);

      try {
        if (files[0]) {
          onUploadBegin?.(files[0].name);
        }

        for (const file of files) {
          if (file.size > maxFileSizeMB * 1024 * 1024) {
            throw new Error(`O arquivo "${file.name}" excede o tamanho máximo de ${maxFileSizeMB}MB.`);
          }
        }

        setProgress(30);

        if (files.length === 1 && files[0]) {
          const file = files[0];
          const base64Data = await readFileAsDataUrl(file);
          setProgress(60);

          const result = await uploadMutation.mutateAsync({
            base64Data,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            entityType,
            entityId,
            entityField,
          });

          setProgress(100);
          const uploadedResult: UploadedFileResult = {
            id: result.id,
            url: result.url,
            ufsUrl: result.url,
            fileName: result.fileName ?? file.name,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
            fileHash: result.fileHash,
          };

          onClientUploadComplete?.([uploadedResult]);
          setIsUploading(false);
          return [uploadedResult];
        } else {
          // Upload múltiplo
          const filesData = await Promise.all(
            files.map(async (file) => ({
              base64Data: await readFileAsDataUrl(file),
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
            }))
          );

          setProgress(60);

          const results = await uploadMultipleMutation.mutateAsync({
            files: filesData,
            entityType,
            entityId,
          });

          setProgress(100);

          const uploadedResults: UploadedFileResult[] = results.map((r) => ({
            id: r.id,
            url: r.url,
            ufsUrl: r.url,
            fileName: r.fileName ?? "arquivo",
            fileSize: r.fileSize,
            mimeType: r.mimeType,
            fileHash: r.fileHash,
          }));

          onClientUploadComplete?.(uploadedResults);
          setIsUploading(false);
          return uploadedResults;
        }
      } catch (err: unknown) {
        setIsUploading(false);
        setProgress(0);
        let error: Error;
        if (err instanceof Error) {
          error = err;
        } else if (typeof err === "object" && err !== null && "message" in err) {
          error = new Error(String(err.message));
        } else {
          error = new Error("Erro durante o upload");
        }
        onUploadError?.(error);
        throw error;
      }
    },
    [
      entityType,
      entityId,
      entityField,
      maxFileSizeMB,
      onClientUploadComplete,
      onUploadError,
      onUploadBegin,
      readFileAsDataUrl,
      uploadMutation,
      uploadMultipleMutation,
    ]
  );

  return {
    startUpload,
    isUploading,
    progress,
  };
}