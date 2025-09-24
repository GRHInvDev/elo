"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useUploadThing } from "@/components/uploadthing"
import { type ClientUploadedFileData } from "uploadthing/types"
import { FileIcon, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileUploaded: (fileData: { url: string; name: string; size: number; type: string }) => void
  onRemove?: () => void
  className?: string
  disabled?: boolean
}

export function FileUpload({ onFileUploaded, onRemove, className, disabled }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<{
    url: string
    name: string
    size: number
    type: string
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res: ClientUploadedFileData<unknown>[]) => {
      if (res && res.length > 0 && res[0]?.ufsUrl) {
        const fileData = {
          url: res[0].ufsUrl,
          name: res[0].name || 'Arquivo',
          size: res[0].size || 0,
          type: res[0].type || 'application/octet-stream',
        }
        setUploadedFile(fileData)
        onFileUploaded(fileData)
      }
      setIsUploading(false)
    },
    onUploadError: (error) => {
      console.error('Erro no upload do arquivo:', error)
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
    setUploadedFile(null)
    onRemove?.()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊'
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️'
    if (type.includes('zip') || type.includes('rar')) return '📦'
    return '📎'
  }

  if (uploadedFile) {
    return (
      <div className={cn("relative inline-block", className)}>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border max-w-xs">
          <div className="text-2xl flex-shrink-0">
            {getFileIcon(uploadedFile.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate block">
                {uploadedFile.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatFileSize(uploadedFile.size)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("inline-block", className)}>
      <input
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.mp3,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        disabled={disabled ?? isUploading}
      />
      <label htmlFor="file-upload">
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
              <FileIcon className="h-4 w-4 mr-2" />
            )}
            {isUploading ? 'Enviando...' : 'Arquivo'}
          </span>
        </Button>
      </label>
    </div>
  )
}
