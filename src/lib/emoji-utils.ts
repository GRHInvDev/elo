/**
 * Utilitário para mapear emojis Unicode para IDs do animated-fluent-emojis
 * e fornecer fallback quando o emoji não está disponível na biblioteca
 */

/**
 * Mapeia emojis Unicode de emoções para IDs do animated-fluent-emojis
 * Apenas emojis relevantes para a régua de emoções
 */
const emojiToIdMap: Record<string, string> = {
  // Faces felizes (níveis 4-5)
  "😀": "grinning-face",
  "😃": "grinning-face",
  "😄": "grinning-face",
  "😁": "grinning-face",
  "😊": "smiling-face",
  "😍": "smiling-face-with-heart-eyes",
  "🥰": "smiling-face-with-heart-eyes",
  "😎": "smiling-face-with-sunglasses",
  "🤗": "hugging-face",
  "😉": "winking-face",
  "😋": "smiling-face",
  "😌": "relieved-face",
  "😇": "smiling-face-with-halo",
  
  // Faces neutras (nível 3)
  "😐": "neutral-face",
  "😑": "neutral-face",
  "😶": "neutral-face",
  "😏": "smirking-face",
  "😒": "neutral-face",
  "🙄": "face-with-rolling-eyes",
  "😴": "sleeping-face",
  "🤤": "sleeping-face",
  
  // Faces tristes/negativas (níveis 0-2)
  "😢": "crying-face",
  "😭": "crying-face",
  "😤": "angry-face",
  "😠": "angry-face",
  "😡": "angry-face",
  "🤬": "angry-face",
  "😞": "sad-face",
  "😟": "worried-face",
  "😕": "confused-face",
  "🙁": "sad-face",
  "☹️": "sad-face",
  "😣": "sad-face",
  "😖": "confused-face",
  "😫": "tired-face",
  "😩": "tired-face",
  "😨": "fearful-face",
  "😰": "worried-face",
  "😥": "sad-face",
  "😓": "worried-face",
}

/**
 * Lista de emojis disponíveis organizados por categoria para seleção
 */
export const availableEmojis = {
  happy: [
    { emoji: "😀", id: "grinning-face", label: "Rosto sorridente" },
    { emoji: "😃", id: "grinning-face", label: "Rosto sorridente com olhos grandes" },
    { emoji: "😄", id: "grinning-face", label: "Rosto sorridente com olhos sorridentes" },
    { emoji: "😁", id: "grinning-face", label: "Rosto radiante" },
    { emoji: "😊", id: "smiling-face", label: "Rosto sorridente" },
    { emoji: "😍", id: "smiling-face-with-heart-eyes", label: "Rosto com olhos de coração" },
    { emoji: "🥰", id: "smiling-face-with-heart-eyes", label: "Rosto sorridente com corações" },
    { emoji: "😎", id: "smiling-face-with-sunglasses", label: "Rosto com óculos escuros" },
    { emoji: "🤗", id: "hugging-face", label: "Rosto abraçando" },
    { emoji: "😉", id: "winking-face", label: "Rosto piscando" },
    { emoji: "😌", id: "relieved-face", label: "Rosto aliviado" },
    { emoji: "😇", id: "smiling-face-with-halo", label: "Rosto com auréola" },
  ],
  neutral: [
    { emoji: "😐", id: "neutral-face", label: "Rosto neutro" },
    { emoji: "😑", id: "neutral-face", label: "Rosto sem expressão" },
    { emoji: "😶", id: "neutral-face", label: "Rosto sem boca" },
    { emoji: "😏", id: "smirking-face", label: "Rosto com sorriso maroto" },
    { emoji: "😒", id: "neutral-face", label: "Rosto não impressionado" },
    { emoji: "🙄", id: "face-with-rolling-eyes", label: "Rosto revirando os olhos" },
    { emoji: "😴", id: "sleeping-face", label: "Rosto dormindo" },
  ],
  sad: [
    { emoji: "😢", id: "crying-face", label: "Rosto chorando" },
    { emoji: "😭", id: "crying-face", label: "Rosto chorando alto" },
    { emoji: "😞", id: "sad-face", label: "Rosto decepcionado" },
    { emoji: "😟", id: "worried-face", label: "Rosto preocupado" },
    { emoji: "😕", id: "confused-face", label: "Rosto confuso" },
    { emoji: "🙁", id: "sad-face", label: "Rosto levemente triste" },
    { emoji: "☹️", id: "sad-face", label: "Rosto triste" },
    { emoji: "😣", id: "sad-face", label: "Rosto perseverante" },
    { emoji: "😖", id: "confused-face", label: "Rosto confundido" },
    { emoji: "😫", id: "tired-face", label: "Rosto cansado" },
    { emoji: "😩", id: "tired-face", label: "Rosto exausto" },
    { emoji: "😨", id: "fearful-face", label: "Rosto com medo" },
    { emoji: "😰", id: "worried-face", label: "Rosto ansioso" },
    { emoji: "😥", id: "sad-face", label: "Rosto triste mas aliviado" },
    { emoji: "😓", id: "worried-face", label: "Rosto suando" },
  ],
  angry: [
    { emoji: "😤", id: "angry-face", label: "Rosto com vapor do nariz" },
    { emoji: "😠", id: "angry-face", label: "Rosto zangado" },
    { emoji: "😡", id: "angry-face", label: "Rosto com raiva" },
    { emoji: "🤬", id: "angry-face", label: "Rosto com símbolos na boca" },
  ],
}

/**
 * Converte um emoji Unicode para o ID correspondente do animated-fluent-emojis
 * @param emoji - Emoji Unicode (ex: "😊")
 * @returns ID do emoji na biblioteca ou null se não encontrado
 */
export function emojiToId(emoji: string | null | undefined): string | null {
  if (!emoji) return null
  
  // Remove espaços e normaliza
  const normalized = emoji.trim()
  
  // Verifica se está no mapa
  return emojiToIdMap[normalized] ?? null
}

/**
 * Converte um ID do animated-fluent-emojis para emoji Unicode
 * @param id - ID do emoji (ex: "smiling-face")
 * @returns Emoji Unicode ou null se não encontrado
 */
export function idToEmoji(id: string | null | undefined): string | null {
  if (!id) return null
  
  // Busca o primeiro emoji que mapeia para este ID
  for (const [emoji, emojiId] of Object.entries(emojiToIdMap)) {
    if (emojiId === id) {
      return emoji
    }
  }
  
  return null
}

/**
 * Verifica se um emoji tem suporte na biblioteca animated-fluent-emojis
 * @param emoji - Emoji Unicode
 * @returns true se o emoji tem suporte
 */
export function hasEmojiSupport(emoji: string | null | undefined): boolean {
  return emojiToId(emoji) !== null
}

/**
 * Obtém todos os emojis disponíveis em uma lista plana
 */
export function getAllAvailableEmojis() {
  return [
    ...availableEmojis.happy,
    ...availableEmojis.neutral,
    ...availableEmojis.sad,
    ...availableEmojis.angry,
  ]
}
