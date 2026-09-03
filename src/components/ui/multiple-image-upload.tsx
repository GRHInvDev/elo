"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { deleteFiles } from "@/server/upltActions";
import { useDataUpload } from "@/hooks/use-data-upload";

interface MultipleImageUploadProps {
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  initialImages?: string[];
  entityType?: string;
}

export function MultipleImageUpload({
  onImagesChange,
  maxImages = 10,
  className,
  initialImages = [],
  entityType = "MULTIPLE_IMAGES",
}: MultipleImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sincronizar quando initialImages mudar
  useEffect(() => {
    setImages(initialImages);
    if (initialImages.length > 0) {
      onImagesChange(initialImages);
    }
  }, [initialImages]); // eslint-disable-line react-hooks/exhaustive-deps

  const { startUpload, isUploading } = useDataUpload({
    entityType,
    onClientUploadComplete: (uploadedResults) => {
      if (uploadedResults && uploadedResults.length > 0) {
        const newUrls = uploadedResults.map((f) => f.url).filter(Boolean);
        setImages((prev) => {
          const updated = [...prev, ...newUrls];
          onImagesChange(updated);
          return updated;
        });
      }
    },
    onUploadError: (error) => {
      console.error("[MultipleImageUpload] Erro ao enviar imagens:", error);
    },
  });

  const handleProcessFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      if (images.length + files.length > maxImages) {
        alert(`Máximo de ${maxImages} imagens permitidas`);
        return;
      }

      try {
        await startUpload(files);
      } catch (err) {
        console.error("Erro no processamento de imagens:", err);
      }
    },
    [images.length, maxImages, startUpload]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      void handleProcessFiles(files);
    },
    [handleProcessFiles]
  );

  const removeImage = useCallback(
    async (index: number) => {
      const imageToRemove = images[index];
      if (imageToRemove) {
        try {
          await deleteFiles(imageToRemove);
        } catch (error) {
          console.error("Erro ao deletar imagem:", error);
        }
      }

      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      const files = Array.from(event.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      void handleProcessFiles(files);
    },
    [handleProcessFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Área de upload */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/80 hover:border-primary/60 hover:bg-muted/50",
          isUploading && "opacity-60 pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById("multiple-image-input")?.click()}
      >
        <input
          id="multiple-image-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center space-y-2">
          {isUploading ? (
            <>
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
              <p className="text-sm font-semibold">Salvando imagens no banco Neon...</p>
              <p className="text-xs text-muted-foreground">Otimizando e gerando identificadores</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">Clique ou arraste imagens aqui</p>
                <p className="text-xs text-muted-foreground">
                  Máximo {maxImages} imagens (PNG, JPG, WEBP)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview das imagens */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Imagens selecionadas ({images.length}/{maxImages})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((imageUrl, index) => (
              <Card key={index} className="relative group overflow-hidden rounded-xl border border-border/80 shadow-sm">
                <div className="aspect-square relative">
                  <Image
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    unoptimized={imageUrl.startsWith("data:") || imageUrl.startsWith("/api/files/")}
                  />

                  {/* Botões de ação */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeImage(index);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Indicador de ordem */}
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                    {index + 1}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
