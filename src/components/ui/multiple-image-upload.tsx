"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, X, Loader2, Plus, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { deleteFiles } from "@/server/upltActions";
import { useDataUpload } from "@/hooks/use-data-upload";
import { useToast } from "@/hooks/use-toast";

export interface MultipleImageUploadProps {
  onImagesChange: (images: string[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  maxImages?: number;
  className?: string;
  initialImages?: string[];
  value?: string[];
  entityType?: string;
  disabled?: boolean;
}

export function MultipleImageUpload({
  onImagesChange,
  onUploadingChange,
  maxImages = 10,
  className,
  initialImages,
  value,
  entityType = "MULTIPLE_IMAGES",
  disabled = false,
}: MultipleImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isControlled = value !== undefined;
  const [internalImages, setInternalImages] = useState<string[]>(() => {
    if (value !== undefined) return value;
    if (initialImages && initialImages.length > 0) return initialImages;
    return [];
  });

  const currentImages = isControlled ? value : internalImages;

  const currentImagesRef = useRef<string[]>(currentImages);
  useEffect(() => {
    currentImagesRef.current = currentImages;
  }, [currentImages]);

  const prevInitialImagesRef = useRef<string[] | undefined>(initialImages);
  useEffect(() => {
    if (!isControlled && initialImages !== undefined && prevInitialImagesRef.current !== initialImages) {
      const prev = prevInitialImagesRef.current ?? [];
      const hasLengthDiff = prev.length !== initialImages.length;
      const hasItemDiff = !hasLengthDiff && initialImages.some((url, idx) => url !== prev[idx]);

      if (hasLengthDiff || hasItemDiff) {
        setInternalImages(initialImages);
      }
      prevInitialImagesRef.current = initialImages;
    }
  }, [initialImages, isControlled]);

  const updateImagesList = useCallback(
    (newImagesList: string[]) => {
      currentImagesRef.current = newImagesList;
      if (!isControlled) {
        setInternalImages(newImagesList);
      }
      onImagesChange(newImagesList);
    },
    [isControlled, onImagesChange]
  );

  const { startUpload, isUploading } = useDataUpload({
    entityType,
    onClientUploadComplete: (uploadedResults) => {
      if (uploadedResults && uploadedResults.length > 0) {
        const newUrls = uploadedResults.map((f) => f.url).filter(Boolean);
        const existing = new Set(currentImagesRef.current);
        const uniqueUrls = newUrls.filter((url) => !existing.has(url));
        const updated = [...currentImagesRef.current, ...uniqueUrls];
        updateImagesList(updated);
      }
    },
    onUploadError: (error) => {
      console.error("[MultipleImageUpload] Erro ao enviar imagens:", error);
      toast({
        title: "Erro no envio",
        description: error.message || "Não foi possível carregar as imagens.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  const handleProcessFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || disabled || isUploading) return;

      const currentCount = currentImagesRef.current.length;
      const availableSlots = maxImages - currentCount;

      if (availableSlots <= 0) {
        toast({
          title: "Limite atingido",
          description: `Você já atingiu o máximo de ${maxImages} imagens permitidas.`,
          variant: "destructive",
        });
        return;
      }

      let filesToUpload = files;
      if (files.length > availableSlots) {
        toast({
          title: "Limite parcial",
          description: `Apenas as primeiras ${availableSlots} de ${files.length} imagem(ns) foram adicionadas (máximo de ${maxImages}).`,
        });
        filesToUpload = files.slice(0, availableSlots);
      }

      try {
        await startUpload(filesToUpload);
      } catch (err) {
        console.error("Erro no processamento de imagens:", err);
      }
    },
    [disabled, isUploading, maxImages, startUpload, toast]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (event.target) {
        event.target.value = "";
      }
      void handleProcessFiles(files);
    },
    [handleProcessFiles]
  );

  const removeImage = useCallback(
    async (index: number) => {
      const imageToRemove = currentImagesRef.current[index];
      const updated = currentImagesRef.current.filter((_, i) => i !== index);
      updateImagesList(updated);

      if (imageToRemove) {
        try {
          await deleteFiles(imageToRemove);
        } catch (error) {
          console.error("Erro ao deletar imagem:", error);
        }
      }
    },
    [updateImagesList]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      if (disabled || isUploading) return;

      const files = Array.from(event.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      void handleProcessFiles(files);
    },
    [disabled, handleProcessFiles, isUploading]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!disabled && !isUploading) {
        setIsDragOver(true);
      }
    },
    [disabled, isUploading]
  );

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const openFileDialog = useCallback(() => {
    if (!disabled && !isUploading && currentImages.length < maxImages) {
      fileInputRef.current?.click();
    }
  }, [currentImages.length, disabled, isUploading, maxImages]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || disabled || currentImages.length >= maxImages}
      />

      {currentImages.length === 0 ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer select-none",
            isDragOver
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border/80 hover:border-primary/60 hover:bg-muted/40",
            (isUploading || disabled) && "opacity-70 pointer-events-none cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <div className="flex flex-col items-center space-y-2">
            {isUploading ? (
              <>
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <p className="text-sm font-semibold">Enviando imagem(ns)...</p>
                <p className="text-xs text-muted-foreground">Otimizando e gerando identificadores</p>
              </>
            ) : (
              <>
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Clique ou arraste imagens aqui</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Selecione uma ou várias fotos (PNG, JPG, WEBP) • Máximo {maxImages}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "space-y-2.5 p-3 rounded-xl border border-border/60 bg-muted/20 transition-all",
            isDragOver && "border-primary bg-primary/5 ring-2 ring-primary/20"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-primary" />
              Imagens anexadas ({currentImages.length}/{maxImages})
            </span>
            {currentImages.length < maxImages && !isUploading && (
              <span className="text-[11px] text-muted-foreground">
                Você pode adicionar mais {maxImages - currentImages.length}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {currentImages.map((imageUrl, index) => (
              <Card
                key={`${imageUrl}-${index}`}
                className="relative group overflow-hidden rounded-xl border border-border/70 shadow-sm bg-card hover:shadow-md transition-all"
              >
                <div className="aspect-square relative w-full h-full">
                  <Image
                    src={imageUrl}
                    alt={`Foto ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    unoptimized={imageUrl.startsWith("data:") || imageUrl.startsWith("/api/files/")}
                  />

                  <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

                  <div className="absolute top-1.5 right-1.5 z-10">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full shadow-md bg-red-600/90 hover:bg-red-600 text-white transition-transform active:scale-95"
                      title="Remover foto"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeImage(index);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                    #{index + 1}
                  </div>
                </div>
              </Card>
            ))}

            {isUploading && (
              <div className="aspect-square rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center p-2 text-center animate-pulse">
                <Loader2 className="h-5 w-5 animate-spin text-primary mb-1" />
                <span className="text-[11px] font-medium text-foreground">Enviando...</span>
                <span className="text-[9px] text-muted-foreground">Otimizando foto</span>
              </div>
            )}

            {!isUploading && currentImages.length < maxImages && (
              <button
                type="button"
                onClick={openFileDialog}
                disabled={disabled}
                className={cn(
                  "aspect-square rounded-xl border-2 border-dashed border-border/80 hover:border-primary hover:bg-primary/5",
                  "flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer group",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors mb-1">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Adicionar
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Foto ou mais
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}