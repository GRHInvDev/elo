/**
 * Utilitário para compartilhar publicações
 * Remove tags e todas formatações para enviar somente o texto
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return ""

  return markdown
    // Remove imagens do markdown: ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "")
    // Converte links [texto](url) mantendo apenas o texto
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Remove cabeçalhos Markdown (# Título)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove blocos de código com cercas ```
    .replace(/```[\s\S]*?```/g, "")
    // Remove código inline `código`
    .replace(/`([^`]+)`/g, "$1")
    // Remove negrito e itálico (**texto**, *texto*, __texto__, _texto_)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove tachado (~~texto~~)
    .replace(/~~(.*?)~~/g, "$1")
    // Remove blockquotes (> citação)
    .replace(/^\s*>\s+/gm, "")
    // Remove listas com marcadores e números
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    // Remove tags HTML
    .replace(/<[^>]*>/g, "")
    // Normaliza quebras de linha e espaços múltiplos
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim()
}

/**
 * Extrai um resumo/subtítulo limpo a partir do conteúdo da publicação
 */
export function extractPostSummary(content: string, maxLength = 160): string {
  const plainText = stripMarkdown(content)
  if (!plainText) return ""

  if (plainText.length <= maxLength) {
    return plainText
  }

  // Corta respeitando o limite de palavras
  const truncated = plainText.slice(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(" ")
  if (lastSpaceIndex > maxLength * 0.7) {
    return `${truncated.slice(0, lastSpaceIndex).trim()}...`
  }

  return `${truncated.trim()}...`
}

/**
 * Obtém a URL absoluta para redirecionar diretamente ao post no feed
 */
export function getPostShareUrl(postId: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/p/${postId}`
  }
  return `/p/${postId}`
}

export interface SharePostData {
  id: string
  title: string
  content: string
  imageUrl?: string | null
  images?: Array<{ imageUrl: string }>
}

export interface SharePostResult {
  success: boolean
  method: "native" | "clipboard" | "aborted" | "error"
  message?: string
}

/**
 * Copia texto para a área de transferência com fallback
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback para document.execCommand se clipboard API falhar
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.left = "-999999px"
      textarea.style.top = "-999999px"
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const successful = document.execCommand("copy")
      document.body.removeChild(textarea)
      return successful
    } catch {
      return false
    }
  }

  return false
}

/**
 * Compartilha o post usando a Web Share API nativa no mobile ou copia o link no desktop
 * Aqui aonde é definido o comportamento e corpo da mensagem
 */
export async function sharePost(post: SharePostData): Promise<SharePostResult> {
  const shareUrl = getPostShareUrl(post.id)
  const summary = extractPostSummary(post.content, 180)
 
  const shareText = summary ? `${post.title}\n\n${summary}` : post.title

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const shareData: ShareData = {
        title: post.title,
        text: shareText,
        url: shareUrl,
      }

      // Se canShare estiver disponível, valida antes de compartilhar
      if (typeof navigator.canShare === "function") {
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
          return { success: true, method: "native" }
        }
      } else {
        await navigator.share(shareData)
        return { success: true, method: "native" }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { success: false, method: "aborted" }
      }
    }
  }

  // Fallback: Copia o link para a área de transferência
  const copied = await copyToClipboard(shareUrl)
  if (copied) {
    return {
      success: true,
      method: "clipboard",
      message: "Link da publicação copiado para a área de transferência!",
    }
  }

  return {
    success: false,
    method: "error",
    message: "Não foi possível compartilhar a publicação.",
  }
}
