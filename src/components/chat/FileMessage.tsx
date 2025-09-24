"use client"

import { Button } from "@/components/ui/button"
import { Download, FileIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileMessageProps {
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  className?: string
}

export function FileMessage({
  fileUrl,
  fileName,
  fileSize,
  fileType,
  className
}: FileMessageProps) {
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

  const handleDownload = () => {
    // Criar um link temporário para download
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 bg-muted/30 rounded-lg border max-w-xs", className)}>
      <div className="text-2xl flex-shrink-0">
        {getFileIcon(fileType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {fileName}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatFileSize(fileSize)}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="flex-shrink-0 h-8 w-8 p-0"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  )
}
