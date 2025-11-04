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

  // Converter \n literal em quebras de linha reais
  // O ReactMarkdown interpreta quebras de linha, mas precisa de \n\n para parágrafos
  // Vamos converter \n para \n\n para que o markdown interprete corretamente
  const processedDescription = description.replace(/\\n/g, "\n\n")

  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Garantir que parágrafos respeitem quebras de linha
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
        }}
      >
        {processedDescription}
      </ReactMarkdown>
    </div>
  )
}

