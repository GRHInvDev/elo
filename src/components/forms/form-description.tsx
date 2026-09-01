"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface FormDescriptionProps {
  description: string | null | undefined
  className?: string
}

/**
 * Componente para renderizar a descrição do formulário interpretando \n como quebras de linha
 */
export function FormDescription({ description, className }: FormDescriptionProps) {
  if (!description) {
    return null
  }

  // Remove eventuais tags antigas [icon:...] caso existam em registros legados
  const cleanDescription = description.replace(/\[icon:[a-z0-9-]+\]/gi, "").trim()
  if (!cleanDescription) {
    return null
  }

  const processedDescription = cleanDescription.replace(/\\n/g, "\n\n")

  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
        }}
      >
        {processedDescription}
      </ReactMarkdown>
    </div>
  )
}
