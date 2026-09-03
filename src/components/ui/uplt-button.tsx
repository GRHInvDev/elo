"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "./button";
import { LucideImagePlus, LucideLoader2, LucideTrash2, LucideUpload } from "lucide-react";
import { deleteFiles } from "@/server/upltActions";
import { useDataUpload, type UploadedFileResult } from "@/hooks/use-data-upload";
import { cn } from "@/lib/utils";

interface UPLTButtonProps {
  onClientUploadComplete?: (res: UploadedFileResult[]) => void;
  onUploadError?: (e: Error) => void;
  onUploadBegin?: (filename: string) => void;
  sendRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
  onImageUrlGenerated: (url: string) => void;
  entityType?: string;
  className?: string;
  showPreview?: boolean;
}

export function UPLTButton({
  onClientUploadComplete,
  onUploadBegin,
  onUploadError,
  onImageUrlGenerated,
  entityType = "IMAGE",
  className,
  showPreview = true,
}: UPLTButtonProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrl, setFileUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useDataUpload({
    entityType,
    onClientUploadComplete: (res) => {
      if (res && res.length > 0 && res[0]?.url) {
        const imageUrl = res[0].url;
        onImageUrlGenerated(imageUrl);
        setFileUrl(imageUrl);
      }
      onClientUploadComplete?.(res);
    },
    onUploadError,
    onUploadBegin,
  });

  const handleUploadFiles = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;
      setFiles(selectedFiles);
      try {
        await startUpload(selectedFiles);
      } catch (err) {
        console.error("[UPLTButton] Erro ao enviar imagem:", err);
      }
    },
    [startUpload]
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);
      void handleUploadFiles(selectedFiles);
      if (event.target) {
        event.target.value = "";
      }
    },
    [handleUploadFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(event.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      void handleUploadFiles(droppedFiles);
    },
    [handleUploadFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleRemove = async () => {
    if (fileUrl.trim() !== "") {
      await deleteFiles(fileUrl);
    }
    setFiles([]);
    setFileUrl("");
    onImageUrlGenerated("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Área de drop e input oculto */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full min-h-[120px] py-4 border-dashed flex items-center justify-center border-2 rounded-xl gap-2 cursor-pointer transition-all ${
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/80 hover:bg-muted/50 hover:border-primary/60"
        } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />
        <div className="flex flex-col items-center justify-center text-center p-3">
          {isUploading ? (
            <>
              <LucideLoader2 className="animate-spin h-7 w-7 text-primary mb-1.5" />
              <span className="text-sm font-semibold">Salvando no banco de dados...</span>
              <span className="text-xs text-muted-foreground mt-0.5">Processando e armazenando imagem</span>
            </>
          ) : files.length > 0 && fileUrl ? (
            <>
              <LucideImagePlus className="h-7 w-7 text-emerald-500 mb-1.5" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Imagem enviada com sucesso!
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                Clique ou arraste outra imagem para substituir
              </span>
            </>
          ) : (
            <>
              <LucideUpload className="h-7 w-7 text-muted-foreground mb-1.5 group-hover:text-primary transition-colors" />
              <span className="text-sm font-semibold">Arraste ou clique para enviar imagem</span>
              <span className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP, GIF até 16MB</span>
            </>
          )}
        </div>
      </div>

      {/* Botões de ação */}
      {showPreview && files.length > 0 && fileUrl && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void handleRemove();
            }}
          >
            <LucideTrash2 className="h-4 w-4 mr-2" />
            Remover Imagem
          </Button>
        </div>
      )}

      {/* Preview da imagem se ativado */}
      {showPreview && fileUrl && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt="Preview"
            className="w-full max-w-xs h-auto rounded-xl border border-border/80 shadow-md object-cover"
          />
        </div>
      )}
    </div>
  );
}