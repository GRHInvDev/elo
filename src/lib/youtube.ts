const IFRAME_SRC_REGEX = /src=["']([^"']+)["']/i
const YOUTUBE_ID_REGEX = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i

/**
 * Extrai o ID do vídeo do YouTube a partir de qualquer formato de link.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const iframeMatch = IFRAME_SRC_REGEX.exec(trimmed)
  const candidate = iframeMatch?.[1] ?? trimmed

  const match = YOUTUBE_ID_REGEX.exec(candidate)

  if (match?.[1]) {
    return match[1]
  }

  if (/^[\w-]{11}$/.test(candidate)) {
    return candidate
  }

  return null
}

/**
 * Normaliza qualquer link do YouTube (watch, share youtu.be, shorts, embed, iframe)
 * para a URL de embed padrão: https://www.youtube.com/embed/{id}
 */
export function normalizeYouTubeEmbedUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ""

  const videoId = extractYouTubeVideoId(trimmed)
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`
  }

  const iframeMatch = IFRAME_SRC_REGEX.exec(trimmed)
  const candidate = iframeMatch?.[1] ?? trimmed

  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    return candidate
  }

  return `https://${candidate}`
}

/**
 * Obtém a imagem da thumbnail do YouTube pelo link do vídeo.
 */
export function getYouTubeThumbnailUrl(input: string): string | null {
  const id = extractYouTubeVideoId(input)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}
