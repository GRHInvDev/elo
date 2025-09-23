"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useUploadThing } from "@/components/uploadthing"
import { type ClientUploadedFileData } from "uploadthing/types"
import { ImageIcon, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void
  onRemove?: () => void
  className?: string
  disabled?: boolean
}

export function ImageUpload({ onImageUploaded, onRemove, className, disabled }: ImageUploadProps) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res: ClientUploadedFileData<unknown>[]) => {
      if (res && res.length > 0 && res[0]?.ufsUrl) {
        const imageUrl = res[0].ufsUrl
        setUploadedImageUrl(imageUrl)
        onImageUploaded(imageUrl)
      }
      setIsUploading(false)
    },
    onUploadError: (error) => {
      console.error('Erro no upload:', error)
      setIsUploading(false)
    },
    onUploadBegin: () => {
      setIsUploading(true)
    },
  })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await startUpload([file])
    }
  }

  const handleRemove = () => {
    setUploadedImageUrl(null)
    onRemove?.()
  }

  if (uploadedImageUrl) {
    return (
      <div className={cn("relative inline-block", className)}>
        <img
          src={uploadedImageUrl}
          alt="Imagem anexada"
          className="max-w-32 max-h-32 rounded-lg border object-cover"
        />
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
          onClick={handleRemove}
          disabled={disabled}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("inline-block", className)}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload"
        disabled={disabled ?? isUploading}
      />
      <label htmlFor="image-upload">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={disabled ?? isUploading}
          asChild
        >
          <span>
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-2" />
            )}
            {isUploading ? 'Enviando...' : 'Imagem'}
          </span>
        </Button>
      </label>
    </div>
  )
}
