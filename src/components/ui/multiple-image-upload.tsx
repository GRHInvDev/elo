"use client"

import { useState, useCallback } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useUploadThing } from "@/components/uploadthing"
import { deleteFiles } from "@/components/uploadthing"
import type { ClientUploadedFileData } from "uploadthing/types"

interface MultipleImageUploadProps {
  onImagesChange: (images: string[]) => void
  maxImages?: number
  className?: string
}

export function MultipleImageUpload({
  onImagesChange,
  maxImages = 10,
  className
}: MultipleImageUploadProps) {
  const [images, setImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const { startUpload } = useUploadThing("multipleImageUploader", {
    onClientUploadComplete: (res: ClientUploadedFileData<unknown>[]) => {
      if (res && res.length > 0) {
        const newUrls = res.map(file => file.ufsUrl).filter(Boolean)
        const updatedImages = [...images, ...newUrls]
        setImages(updatedImages)
        onImagesChange(updatedImages)
      }
      setIsUploading(false)
    },
    onUploadError: (error) => {
      console.error("Erro no upload:", error)
      alert("Erro no upload: Configure as credenciais do UploadThing no arquivo .env.local")
      setIsUploading(false)
    },
    onUploadBegin: () => {
      setIsUploading(true)
    },
  })

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    
    if (files.length === 0) return

    // Verificar limite de imagens
    if (images.length + files.length > maxImages) {
      alert(`Máximo de ${maxImages} imagens permitidas`)
      return
    }

    try {
      await startUpload(files)
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error)
    }
  }, [images.length, maxImages, startUpload])

  const removeImage = useCallback(async (index: number) => {
    const imageToRemove = images[index]
    if (imageToRemove) {
      try {
        // Extrair o ID do arquivo da URL do UploadThing
        const fileId = imageToRemove.replace("https://162synql7v.ufs.sh/f/", "")
        await deleteFiles(fileId)
      } catch (error) {
        console.error("Erro ao deletar imagem do UploadThing:", error)
      }
    }

    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImagesChange(newImages)
  }, [images, onImagesChange])


  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length === 0) return

    // Verificar limite de imagens
    if (images.length + files.length > maxImages) {
      alert(`Máximo de ${maxImages} imagens permitidas`)
      return
    }

    try {
      void startUpload(files)
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error)
    }
  }, [images.length, maxImages, startUpload])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Área de upload */}
      <div
        className={cn(
          "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center transition-colors",
          "hover:border-muted-foreground/50 cursor-pointer",
          isUploading && "opacity-50 pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('multiple-image-input')?.click()}
      >
        <input
          id="multiple-image-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-2">
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Fazendo upload...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Clique ou arraste imagens aqui</p>
                <p className="text-xs text-muted-foreground">
                  Máximo {maxImages} imagens
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview das imagens */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Imagens selecionadas ({images.length}/{maxImages})</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {images.map((imageUrl, index) => (
              <Card key={index} className="relative group overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  
                  {/* Botões de ação */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Botão de remover */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        void removeImage(index)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Indicador de ordem */}
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                    {index + 1}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
