import { generateText } from "ai"
import { getAssistantChatModel } from "./azure-assistant-model"
import {
  type IsometricRoomModel,
  type IsometricFurnitureItem,
} from "@/types/isometric-room"

export interface BuildRoomVisionInput {
  imageUrls: string[]
  roomName?: string
  capacity?: number
  floor?: number
  filial?: string
  additionalContext?: string
}

export const MASTER_NEGATIVE_PROMPT =
  "adjacent rooms, external office, background people, office cubicles beyond glass, room extension, hallways, floating detached doors, stickers on glass, window decals, logos, text watermark, red ball, toys, papers, trash, messy wires, pixel art, low-res pixelated sprites, white background, gray gradient background, perspective distortion, non-isometric angle."

/**
 * Gera a imagem da maquete 3D isométrica usando o endpoint de imagem configurado no Azure OpenAI.
 * NUNCA utiliza imagens locais: a maquete utiliza única e exclusivamente a imagem gerada por IA.
 */
async function tryGenerateDioramaImage(prompt: string): Promise<string | null> {
  const endpoint   = process.env.AZURE_OPENAI_IMAGE_ENDPOINT
  const apiKey     = process.env.AZURE_OPENAI_IMAGE_API_KEY
  const deployment = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT
  const apiVersion = process.env.AZURE_OPENAI_IMAGE_API_VERSION

  if (!endpoint || !apiKey || !deployment || !apiVersion) {
    console.warn("[room-vision-builder] Variáveis do Azure OpenAI Image não configuradas.")
    return null
  }

  let u = endpoint.replace(/\/$/, "")
  u = u.replace(/\/openai\/deployments.*$/, "")
  u = u.replace(/\/openai\/v\d+.*$/, "")
  u = u.replace(/\/v\d+.*$/, "")
  u = u.replace(/\/openai.*$/, "")

  const url = `${u}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    })

    if (res.ok) {
      const data = (await res.json()) as { data?: Array<{ url?: string; b64_json?: string }> }
      if (data.data?.[0]?.url) return data.data[0].url
      if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`
    } else {
      const errData: unknown = await res.json().catch(() => ({}))
      console.error(
        `[room-vision-builder] Erro na geração de imagem IA (${deployment}, status ${res.status}):`,
        errData
      )
    }
  } catch (err) {
    console.error(`[room-vision-builder] Erro de conexão com Azure Image API (${deployment}):`, err)
  }

  // Fallback opcional para OpenAI Direct caso configurado
  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY.trim()}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as { data?: Array<{ url?: string; b64_json?: string }> }
        if (data.data?.[0]?.url) return data.data[0].url
        if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`
      }
    } catch (e) {
      console.warn("[room-vision-builder] Falha OpenAI Direct:", e)
    }
  }

  return null
}

/**
 * Gera um modelo isométrico procedural inteligente e estético
 * para salas existentes ou quando a IA de visão estiver offline.
 */
export function generateDefaultIsometricModel(params: {
  name?: string
  capacity?: number
  floor?: number
}): IsometricRoomModel {
  const cap = Math.max(2, params.capacity ?? 6)
  const name = params.name ?? "Sala de Reunião"
  const isAuditorium = cap >= 20 || name.toLowerCase().includes("treinamento") || name.toLowerCase().includes("auditório")
  const isAquario = name.toLowerCase().includes("vidro") || name.toLowerCase().includes("aquário") || cap <= 6

  const gridWidth = isAuditorium ? 9 : cap > 10 ? 8 : 6
  const gridDepth = isAuditorium ? 8 : cap > 10 ? 7 : 6

  const centerX = Math.floor(gridWidth / 2)
  const centerY = Math.floor(gridDepth / 2)

  const furniture: IsometricFurnitureItem[] = []

  if (isAquario || cap <= 6) {
    // Sala de Reunião Executiva / Vidro com Mesa Redonda de Vidro e Painel Ripado com TV na parede esquerda
    furniture.push({
      id: "table-round-glass",
      type: "round_glass_table",
      x: centerX,
      y: centerY,
      width: 2,
      depth: 2,
      material: "black_glass",
      label: "Mesa Redonda de Vidro Preto",
    })

    furniture.push({
      id: "chair-round-1",
      type: "executive_chair",
      x: centerX - 0.7,
      y: centerY,
      rotation: 90,
      material: "black_leather",
      label: "Cadeira Executiva Couro Preto",
    })
    furniture.push({
      id: "chair-round-2",
      type: "executive_chair",
      x: centerX + 1.7,
      y: centerY,
      rotation: 270,
      material: "black_leather",
      label: "Cadeira Executiva Couro Preto",
    })
    furniture.push({
      id: "chair-round-3",
      type: "executive_chair",
      x: centerX,
      y: centerY - 0.8,
      rotation: 180,
      material: "black_leather",
      label: "Cadeira Executiva Couro Preto",
    })
    furniture.push({
      id: "chair-round-4",
      type: "executive_chair",
      x: centerX,
      y: centerY + 1.8,
      rotation: 0,
      material: "black_leather",
      label: "Cadeira Executiva Couro Preto",
    })

    furniture.push({
      id: "chair-support-1",
      type: "visitor_chair",
      x: 1,
      y: 0.5,
      rotation: 180,
      label: "Cadeira de Espera",
    })
    furniture.push({
      id: "chair-support-2",
      type: "visitor_chair",
      x: 2.2,
      y: 0.5,
      rotation: 180,
      label: "Cadeira de Espera",
    })

    furniture.push({
      id: "tv-wood-wall",
      type: "tv_screen",
      x: 0,
      y: centerY,
      wall: "left",
      width: 2,
      depth: 1,
      label: "Smart TV 55' no Painel Amadeirado",
    })

    furniture.push({
      id: "ac-unit",
      type: "air_conditioner",
      x: gridWidth - 1,
      y: 1,
      wall: "right",
      label: "Ar Condicionado Split",
    })

    furniture.push({
      id: "ceiling-led",
      type: "ceiling_light",
      x: centerX,
      y: centerY,
      label: "Luminária Linear LED",
    })

    const masterPrompt = `A high-end 3D isometric cutaway diorama render of an office meeting room, floating in complete isolation against a solid pure black background (#000000).

Architectural Layout:
- Orthographic isometric perspective viewed from an elevated 45-degree angle.
- Clean floor cutaway platform with light beige large square ceramic tiles.
- Two solid walls: one left wall featuring an elegant vertical light-oak wood slat slatwall panel with a mounted flat-screen TV.
- One back bounding wall made of a framed glass partition window (the glass acts as the room's boundary; inside is visible, outside is pitch black with subtle glass reflection).
- No exterior adjacent rooms, no exterior office desks, no outside corridors, no exterior people.
- Front walls are open cutaway for clear interior visibility.

Furniture & Interior:
- Center: A round meeting table with a light oak wood pedestal base and a tempered dark glass circular top.
- Seating: Exactly 5 modern ergonomic executive chairs with black mesh/leather seats and chrome metal frames arranged around the table.
- Empty, pristine, and perfectly organized room.

Lighting & Style:
- Clean architectural Octane 3D render style, realistic materials, soft ambient studio lighting, soft shadows on the floor.
- No loose clutter, no stickers or text decals on the glass, no red balls, no floating doors, no people.`

    return {
      gridSize: { width: gridWidth, depth: gridDepth },
      walls: {
        left: {
          position: "left",
          material: "wood_panel",
          hasWoodPanel: true,
          accent: true,
        },
        right: {
          position: "right",
          material: "glass",
          hasOfficeView: true,
        },
        back: {
          position: "back",
          material: "glass",
          hasOfficeView: true,
        },
      },
      floor: {
        material: "white_tile",
        pattern: "large_tiles",
      },
      lighting: {
        mood: "bright",
        type: "linear_led",
        ceilingLights: 1,
      },
      furniture,
      features: [
        "Mesa Redonda de Vidro Preto",
        "Smart TV no Painel Ripado de Madeira",
        "Divisórias Panorâmicas de Vidro",
        "Ar Condicionado Split",
        "Cadeiras em Couro Preto",
        "Piso em Porcelanato Polido",
      ],
      detectedAtmosphere: "Sala executiva moderna com divisórias de vidro, painel de madeira com TV e mesa redonda de vidro.",
      imageUrl: undefined,
      masterPrompt,
      negativePrompt: MASTER_NEGATIVE_PROMPT,
      generatedAt: new Date().toISOString(),
      photoSourceCount: 0,
    }
  }

  const defaultMasterPrompt = `A high-end 3D isometric cutaway diorama render of a corporate meeting room for ${cap} people, floating in complete isolation against a solid pure black background (#000000).

Architectural Layout:
- Orthographic isometric perspective viewed from an elevated 45-degree angle.
- Clean floor cutaway platform with light beige large square ceramic tiles.
- Two solid walls: one left wall featuring an elegant wood panel with a mounted flat-screen TV.
- One back bounding wall made of a framed glass partition window looking into pitch black void with subtle glass reflection.
- No exterior adjacent rooms, no exterior office desks, no outside corridors, no exterior people.
- Front walls are open cutaway for clear interior visibility.

Furniture & Interior:
- Center: An executive meeting table sized for ${cap} people.
- Seating: Exactly ${cap} modern ergonomic executive chairs with black seats and chrome metal frames arranged around the table.
- Empty, pristine, and perfectly organized room.

Lighting & Style:
- Clean architectural Octane 3D render style, realistic materials, soft ambient studio lighting, soft shadows on the floor.
- No loose clutter, no stickers or text decals on the glass, no red balls, no floating doors, no people.`

  return {
    gridSize: { width: gridWidth, depth: gridDepth },
    walls: {
      left: { position: "left", material: "wood_panel", accent: true },
      right: { position: "right", material: "glass", hasOfficeView: true },
      back: { position: "back", material: "glass", hasOfficeView: true },
    },
    floor: { material: "white_tile", pattern: "large_tiles" },
    lighting: { mood: "bright", type: "linear_led", ceilingLights: 1 },
    furniture,
    features: [`Capacidade: ${cap} pessoas`, "Smart TV", "Divisórias de Vidro"],
    detectedAtmosphere: `Sala planejada para ${cap} pessoas com acabamento corporativo.`,
    imageUrl: undefined,
    masterPrompt: defaultMasterPrompt,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    generatedAt: new Date().toISOString(),
    photoSourceCount: 0,
  }
}

/**
 * Pipeline de 2 Etapas (Conforme Manual Técnico & Diretrizes de Maquetes Isométricas 3D):
 * Etapa 1: Análise Estrutural por Visão Computacional (VLM - Dinâmica para qualquer foto).
 * Etapa 2: Síntese de Prompt Otimizado no Template Mestre para o Gerador de Imagem.
 */
export async function buildIsometricRoomFromPhotos(
  input: BuildRoomVisionInput
): Promise<IsometricRoomModel> {
  const model = getAssistantChatModel()

  // Se o modelo de IA não estiver configurado no servidor, usa fallback procedural
  if (!model || !input.imageUrls || input.imageUrls.length === 0) {
    return generateDefaultIsometricModel({
      name: input.roomName,
      capacity: input.capacity,
      floor: input.floor,
    })
  }

  const promptText = `
Você é um Especialista Sênior em Visão Computacional, Arquitetura de Interiores e Engenharia de Prompt 3D Isométrica.

SEU OBJETIVO ABSOLUTO: Fidelidade cirúrgica aos objetos, materiais e mobílias REAIS presentes nas fotos enviadas.
A maquete 3D final gerada por IA DEVE reproduzir com precisão fotogramétrica os mesmos itens da foto, sem alucinar decorações fictícias e sem trocar o estilo dos móveis reais.

### PROTOCOLO DE INSPEÇÃO FORENSE DAS FOTOS (ITEM POR ITEM):

1. **ANÁLISE DE PISO:**
   - Inspecione a textura, cor e paginação do chão das fotos:
     * Porcelanato/cerâmica: qual a cor exata (bege polido, off-white, cinza) e o formato das placas?
     * Piso vinílico/laminado: qual a tonalidade da madeira (carvalho claro, nogueira)?
     * Carpete corporativo: qual o tom (cinza chumbo, grafite)?

2. **ANÁLISE DA PAREDE ESQUERDA (Left Wall):**
   - Qual é o revestimento de fundo? (Ex: painel ripado vertical de madeira clara natural/slatwall, parede lisa pintada de branco/cinza, concreto aparente, tijolo).
   - Quais equipamentos/objetos estão montados nela? (Ex: Smart TV de tela preta montada no centro, ar-condicionado split branco no topo, lousa de vidro).

3. **ANÁLISE DA PAREDE DO FUNDO (Back Wall):**
   - Qual é a estrutura real? (Ex: divisória de vidro temperado do chão ao teto com esquadria de alumínio preto fosco, janela com persianas, ou parede sólida).
   - REGRA DO VIDRO: O vidro é a fronteira da sala. O exterior além do vidro DEVE ser o vazio preto absoluto (#000000) com reflexo suave de estúdio. NUNCA desenhar outras salas, corredores ou pessoas fora da sala.

4. **ANÁLISE DETALHADA DA MESA CENTRAL (Centerpiece):**
   - Formato geométrico real: Mesa redonda? Retangular corporativa? Oval em barco? Quadrada?
   - Tampo da mesa: Vidro temperado escuro/fumê? Madeira clara? Laminado branco? Granito/mármore?
   - Base/Pés da mesa: Pedestal cilíndrico central amadeirado/ripado? Pés metálicos tubulares pretos/cromados? Cavaletes? Base tipo caixa?

5. **ANÁLISE DETALHADA DAS CADEIRAS (Seating Inventory):**
   - Contagem exata de cadeiras ao redor da mesa: Quantas cadeiras estão posicionadas ao redor da mesa? (Ex: exatamente 4, 5, 6, 8 ou 10 cadeiras).
   - Modelo e estrutura das cadeiras:
     * Encosto e assento: Couro/ecocouro preto com gomos/costuras horizontais? Tecido mesh telado? Estofado cinza?
     * Base das cadeiras: Base metálica tubular cromada contínua tipo trenó/cantilever (sem rodízios)? Ou base estrela giratória de 5 pontas com rodinhas?
   - Assentos secundários: Há cadeiras de visitante/espera encostadas na parede? (Ex: 2 cadeiras pretas com base trenó encostadas na parede lateral).

6. **ENQUADRAMENTO DE MAQUETE DIORAMA (5 Regras de Ouro):**
   - Fundo: Fundo preto sólido absoluto (#000000), sem chão infinito.
   - Enquadramento: Ângulo isométrico ortogonal de 45°, corte aberto (cutaway) sem teto e sem paredes frontais.
   - Descarte estrito: PROIBIDO adicionar plantas em vasos, quadros aleatórios, papéis soltos, adesivos no vidro, bolas vermelhas ou pessoas.

### SÍNTESE DO "masterPrompt" (ESTRUTURA MESTRE OBRIGATÓRIA):
Preencha cada seção da estrutura abaixo com a descrição física exata dos itens que você extraiu das fotos da sala:

"A high-end 3D isometric cutaway diorama render of an office [tipo/nome da sala], floating in complete isolation against a solid pure black background (#000000).

Architectural Layout:
- Orthographic isometric perspective viewed from an elevated 45-degree angle.
- Clean floor cutaway platform with [DETALHE FÍSICO DO PISO: material, cor, tamanho das placas/réguas].
- Two solid walls: one left wall featuring [MATERIAL DETALHADO DA PAREDE ESQUERDA E EQUIPAMENTOS MONTADOS], and one back bounding wall made of [MATERIAL DETALHADO DA PAREDE DO FUNDO; se for vidro: a framed glass partition window looking into pitch black void with subtle reflection].
- No exterior adjacent rooms, no exterior office desks, no outside corridors, no exterior people.
- Front walls are open cutaway for clear interior visibility.

Furniture & Interior:
- Center: [MESA CENTRAL DETALHADA: formato exato, material e acabamento do tampo, tipo e material da base/pés].
- Seating: Exactly [CONTAGEM EXATA] [MODELO, COR, TIPO DE ESTOFAMENTO E TIPO DE BASE METÁLICA DAS CADEIRAS] arranged around the table.
- [CADEIRAS EXTRAS DE APOIO ENCOSTADAS NA PAREDE OU OUTRO MÓVEL FIXO REAL DETECTADO, ex: Exactly 2 black visitor chairs with chrome cantilever sled base against the side wall].
- Empty, pristine, and perfectly organized room.

Lighting & Style:
- Clean architectural Octane 3D render style, realistic materials, soft ambient studio lighting, soft shadows on the floor.
- No loose clutter, no stickers or text decals on the glass, no red balls, no floating doors, no people."

### SAÍDA ESPERADA:
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown envolventes):
{
  "gridSize": { "width": 6, "depth": 6 },
  "detectedItems": {
    "floor": "Descrição detalhada do piso real",
    "leftWall": "Descrição detalhada da parede esquerda e itens montados",
    "backWall": "Descrição detalhada da parede do fundo",
    "table": "Descrição detalhada da mesa central (formato, tampo, pés)",
    "chairs": "Descrição detalhada das cadeiras (quantidade, modelo, estofado, base)",
    "supportChairs": "Descrição de cadeiras extras de apoio se houver"
  },
  "walls": {
    "left": { "position": "left", "material": "wood_panel | painted | glass | concrete", "hasWoodPanel": boolean },
    "right": { "position": "right", "material": "glass | painted | wood_panel" },
    "back": { "position": "back", "material": "glass | painted | wood_panel" }
  },
  "floor": { "material": "white_tile | wood_parquet | dark_tile | carpet", "pattern": "large_tiles | planks | solid" },
  "lighting": { "mood": "bright | warm | cool", "type": "linear_led | recessed_spots | natural" },
  "furniture": [
    { "id": "m-1", "type": "string", "x": 3, "y": 3, "label": "Nome do móvel real detectado" }
  ],
  "features": ["Lista de características reais detectadas na sala"],
  "detectedAtmosphere": "Descrição real e concisa da sala analisada",
  "masterPrompt": "O prompt completo em inglês preenchido com a descrição física exata de cada item real desta sala específica"
}

Dados informados pelo usuário:
Nome: "${input.roomName ?? "Sala de Reunião"}"
Capacidade informada: ${input.capacity ?? 6} pessoas
Andar: ${input.floor ?? 1}
Filial: "${input.filial ?? "SCS"}"
Contexto adicional: "${input.additionalContext ?? "Nenhum"}"
`

  try {
    const response = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
            },
            ...input.imageUrls.filter(Boolean).map((url) => {
              try {
                return {
                  type: "image" as const,
                  image: url.startsWith("data:") ? url : new URL(url),
                }
              } catch {
                return {
                  type: "image" as const,
                  image: url,
                }
              }
            }),
          ],
        },
      ],
    })

    // Extrair JSON do texto gerado
    const rawText = response.text.trim()
    // Remove blocos de código ```json e ``` se existirem
    const cleanedText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
    const jsonMatch = /\{[\s\S]*\}/.exec(cleanedText)
    let parsedData: Partial<IsometricRoomModel> = {}

    if (jsonMatch) {
      try {
        parsedData = JSON.parse(jsonMatch[0]) as Partial<IsometricRoomModel>
      } catch (parseErr) {
        console.warn("[room-vision-builder] Erro ao parsear JSON:", parseErr)
      }
    }

    // Tentar gerar a imagem 3D da maquete se houver endpoint de imagem
    let dioramaImageUrl = parsedData.imageUrl
    if (!dioramaImageUrl && parsedData.masterPrompt) {
      const promptToGenerate = parsedData.masterPrompt.trim()

      const generatedUrl = await tryGenerateDioramaImage(promptToGenerate)
      if (generatedUrl) {
        dioramaImageUrl = generatedUrl
      }
    }

    // Se o Azure DALL-E estiver configurado, usa a URL gerada; caso contrário, deixa undefined para o usuário anexar ou configurar o deployment
    const fallback = generateDefaultIsometricModel({
      name: input.roomName,
      capacity: input.capacity,
      floor: input.floor,
    })

    // Sanitizar móveis para garantir que todos possuem id, type, x, y válidos
    const sanitizedFurniture: IsometricFurnitureItem[] = (
      parsedData.furniture && Array.isArray(parsedData.furniture)
        ? parsedData.furniture
        : fallback.furniture
    ).map((item, idx) => ({
      id: item.id ?? `furniture-${idx + 1}`,
      type: item.type ?? "chair",
      x: typeof item.x === "number" ? item.x : 3,
      y: typeof item.y === "number" ? item.y : 3,
      width: item.width,
      depth: item.depth,
      rotation: item.rotation,
      wall: item.wall,
      color: item.color,
      material: item.material,
      label: item.label ?? String(item.type ?? "Móvel"),
    }))

    return {
      gridSize: parsedData.gridSize ?? fallback.gridSize,
      walls: parsedData.walls ?? fallback.walls,
      floor: parsedData.floor ?? fallback.floor,
      lighting: parsedData.lighting ?? fallback.lighting,
      furniture: sanitizedFurniture,
      features: parsedData.features ?? fallback.features,
      detectedAtmosphere: parsedData.detectedAtmosphere ?? fallback.detectedAtmosphere,
      imageUrl: dioramaImageUrl ?? undefined,
      masterPrompt: parsedData.masterPrompt ?? fallback.masterPrompt,
      negativePrompt: MASTER_NEGATIVE_PROMPT,
      generatedAt: new Date().toISOString(),
      photoSourceCount: input.imageUrls.length,
    }
  } catch (error) {
    console.error("[room-vision-builder] Erro no processamento do VLM:", error)
    const fallback = generateDefaultIsometricModel({
      name: input.roomName,
      capacity: input.capacity,
      floor: input.floor,
    })
    return {
      ...fallback,
      imageUrl: undefined,
      photoSourceCount: input.imageUrls.length,
      detectedAtmosphere: "Modelo reconstruído com base na descrição e fotos da sala.",
    }
  }
}
