/**
 * Mapeamento de IDs de emojis para URLs das imagens animadas do GitHub
 * Baseado em: https://github.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis
 */

const EMOJI_BASE_URL = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Microsoft-Teams-Animated-Emojis/master/Emojis"

/**
 * Mapeia IDs de emojis para caminhos das imagens no GitHub
 * Baseado na estrutura do repositório: https://github.com/Tarikul-Islam-Anik/Microsoft-Teams-Animated-Emojis
 */
const emojiIdToImagePath: Record<string, string> = {
  // Faces felizes
  "grinning-face": "Smilies/Grinning%20Face.png",
  "smiling-face": "Smilies/Smiling%20Face.png",
  "smiling-face-with-heart-eyes": "Smilies/Smiling%20Face%20with%20Heart-Eyes.png",
  "smiling-face-with-sunglasses": "Smilies/Smiling%20Face%20with%20Sunglasses.png",
  "hugging-face": "Smilies/Hugging%20Face.png",
  "winking-face": "Smilies/Winking%20Face.png",
  "relieved-face": "Smilies/Relieved%20Face.png",
  "smiling-face-with-halo": "Smilies/Smiling%20Face%20with%20Halo.png",
  
  // Faces neutras
  "neutral-face": "Smilies/Neutral%20Face.png",
  "smirking-face": "Smilies/Smirking%20Face.png",
  "face-with-rolling-eyes": "Smilies/Face%20with%20Rolling%20Eyes.png",
  "sleeping-face": "Smilies/Sleeping%20Face.png",
  
  // Faces tristes
  "crying-face": "Smilies/Crying%20Face.png",
  "sad-face": "Smilies/Sad%20Face.png",
  "worried-face": "Smilies/Worried%20Face.png",
  "confused-face": "Smilies/Confused%20Face.png",
  "tired-face": "Smilies/Tired%20Face.png",
  "fearful-face": "Smilies/Fearful%20Face.png",
  
  // Faces zangadas
  "angry-face": "Smilies/Angry%20Face.png",
}

/**
 * Converte um ID de emoji para a URL da imagem no GitHub
 * @param emojiId - ID do emoji (ex: "smiling-face")
 * @returns URL completa da imagem ou null se não encontrado
 */
export function getEmojiImageUrl(emojiId: string | null | undefined): string | null {
  if (!emojiId) return null
  
  const imagePath = emojiIdToImagePath[emojiId]
  if (!imagePath) return null
  
  // O caminho já está com espaços codificados como %20
  return `${EMOJI_BASE_URL}/${imagePath}`
}

/**
 * Verifica se um ID de emoji tem imagem disponível
 * @param emojiId - ID do emoji
 * @returns true se a imagem está disponível
 */
export function hasEmojiImage(emojiId: string | null | undefined): boolean {
  return emojiId ? emojiIdToImagePath[emojiId] !== undefined : false
}
