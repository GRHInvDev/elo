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
  "right wall, partial right wall, side wall on the right, front walls, right-side window, framed window cutout, cloudy window, exterior window with sky, residential window, glass window with sky, door next to tv, random doors, floating doors, third wall, fourth wall, enclosed room, ceiling, roof, false ceiling, dropped ceiling, ceiling slab, overhead cover, enclosed roof, top slab, reversed chairs, backward furniture, flipped chairs, inverted furniture, chairs facing away from table, duplicate chairs, extra furniture, multiplied chairs, phantom seating, hallucinated items, unverified objects, random decorative plants, floating detached doors, stickers on glass, window decals, logos, text watermark, red ball, toys, papers, trash, messy wires, pixel art, low-res pixelated sprites, white background, gray gradient background, perspective distortion, non-isometric angle, normal flat photography, adjacent rooms, external office, background people, office cubicles beyond glass, room extension, hallways."

const IMAGE_SIZE = "1024x1024"

function buildAzureImagesBaseUrl(endpoint: string, deployment: string, apiVersion: string): string {
  let u = endpoint.replace(/\/$/, "")
  u = u.replace(/\/openai\/deployments.*$/, "")
  u = u.replace(/\/openai\/v\d+.*$/, "")
  u = u.replace(/\/v\d+.*$/, "")
  u = u.replace(/\/openai.*$/, "")
  return `${u}/openai/deployments/${deployment}/images/{OP}?api-version=${apiVersion}`
}

function extractImageResult(data: { data?: Array<{ url?: string; b64_json?: string }> }): string | null {
  if (data.data?.[0]?.url) return data.data[0].url
  if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`
  return null
}

/**
 * Gera a imagem da maquete 3D isométrica via endpoint de geração do Azure OpenAI.
 */
async function tryGenerateDioramaImage(prompt: string): Promise<string | null> {
  const endpoint   = process.env.AZURE_OPENAI_IMAGE_ENDPOINT
  const apiKey     = process.env.AZURE_OPENAI_IMAGE_API_KEY
  const deployment = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT
  const apiVersion = process.env.AZURE_OPENAI_IMAGE_API_VERSION

  if (endpoint && apiKey && deployment && apiVersion) {
    const url = buildAzureImagesBaseUrl(endpoint, deployment, apiVersion).replace("{OP}", "generations")

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
          size: IMAGE_SIZE,
        }),
      })

      if (res.ok) {
        const data = (await res.json()) as { data?: Array<{ url?: string; b64_json?: string }> }
        const result = extractImageResult(data)
        if (result) return result
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
  } else {
    console.warn("[room-vision-builder] Variáveis do Azure OpenAI Image não configuradas.")
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
        const result = extractImageResult(data)
        if (result) return result
      }
    } catch (e) {
      console.warn("[room-vision-builder] Falha OpenAI Direct:", e)
    }
  }

  return null
}

/**
 * Orquestra a geração da imagem da maquete diorama.
 */
async function generateDioramaImage(
  masterPrompt: string,
  negativePrompt: string
): Promise<string | null> {
  const combinedPrompt = `${masterPrompt}\n\nStrictly avoid / do not include: ${negativePrompt}`
  return tryGenerateDioramaImage(combinedPrompt)
}

/**
 * Gera um modelo isométrico procedural limpo e neutro
 * para salas existentes ou quando a IA de visão estiver offline.
 * Não força pré-definições de layout nem tetos.
 */
export function generateDefaultIsometricModel(params: {
  name?: string
  capacity?: number
  floor?: number
}): IsometricRoomModel {
  const cap = Math.max(2, params.capacity ?? 6)
  const roomName = params.name ?? "Sala de Reunião"

  // Dimensões do grid proporcionais à capacidade
  const chairsPerSide = Math.max(1, Math.floor(cap / 2))
  const gridWidth = Math.max(6, chairsPerSide + 4)
  const gridDepth = 6

  const centerX = Math.floor(gridWidth / 2)
  const centerY = Math.floor(gridDepth / 2)

  const furniture: IsometricFurnitureItem[] = []

  // Mesa central proporcional
  furniture.push({
    id: "table-main",
    type: "conference_table",
    x: centerX,
    y: centerY,
    width: Math.max(2, chairsPerSide),
    depth: 2,
    material: "wood_or_laminate",
    label: "Mesa de Reunião",
  })

  // Cadeiras distribuídas simetricamente e voltadas para a mesa central
  let placedChairs = 0
  const startX = centerX - Math.floor(chairsPerSide / 2)

  // Cadeiras no lado superior (voltadas para o centro da mesa -> rotation: 180)
  for (let i = 0; i < chairsPerSide && placedChairs < cap; i++) {
    furniture.push({
      id: `chair-top-${i + 1}`,
      type: "executive_chair",
      x: startX + i * 1.1,
      y: centerY - 1.2,
      rotation: 180,
      material: "ergonomic_fabric_or_leather",
      label: "Cadeira",
    })
    placedChairs++
  }

  // Cadeiras no lado inferior (voltadas para o centro da mesa -> rotation: 0)
  for (let i = 0; i < chairsPerSide && placedChairs < cap; i++) {
    furniture.push({
      id: `chair-bottom-${i + 1}`,
      type: "executive_chair",
      x: startX + i * 1.1,
      y: centerY + 1.2,
      rotation: 0,
      material: "ergonomic_fabric_or_leather",
      label: "Cadeira",
    })
    placedChairs++
  }

  // Cadeiras restantes nas cabeceiras se necessário
  if (placedChairs < cap) {
    furniture.push({
      id: "chair-head-left",
      type: "executive_chair",
      x: centerX - Math.floor(chairsPerSide / 2) - 1.1,
      y: centerY,
      rotation: 90,
      material: "ergonomic_fabric_or_leather",
      label: "Cadeira de Cabeceira",
    })
    placedChairs++
  }

  if (placedChairs < cap) {
    furniture.push({
      id: "chair-head-right",
      type: "executive_chair",
      x: centerX + Math.floor(chairsPerSide / 2) + 1.1,
      y: centerY,
      rotation: 270,
      material: "ergonomic_fabric_or_leather",
      label: "Cadeira de Cabeceira",
    })
    placedChairs++
  }

  const defaultMasterPrompt = `A high-end 3D isometric cutaway diorama render of a corporate meeting room "${roomName}" for ${cap} people, floating in complete isolation against a solid pure black background (#000000).

Architectural Layout:
- Orthographic isometric perspective viewed from an elevated 45-degree angle from the front-left cutaway corner.
- Clean floor cutaway platform with modern neutral porcelain floor tiles.
- Strict 2-wall corner cutaway: EXACTLY two walls meeting at the back corner (one left wall and one back wall). Completely open front and open right side.
- Absolutely NO ceiling, NO roof, NO right wall, NO front wall.
- No exterior adjacent rooms, no exterior office desks, no outside corridors, no exterior people.

Furniture & Interior:
- Center: A conference meeting table properly sized for ${cap} people.
- Seating: Exactly ${cap} modern ergonomic executive office chairs neatly arranged around the table, ALL facing inward toward the center table.
- Empty, pristine, and perfectly organized room.

Lighting & Style:
- Clean architectural Octane 3D render style, realistic materials, soft ambient studio lighting, soft shadows on the floor.
- No loose clutter, no stickers or text decals on the glass, no red balls, no floating doors, no ceiling, no people.
- Avoid: ceiling, roof, right wall, front wall, partial walls, windows with sky, reversed chairs, backward furniture, extra chairs, duplicate furniture, background people.`

  return {
    gridSize: { width: gridWidth, depth: gridDepth },
    walls: {
      left: { position: "left", material: "solid" },
      right: { position: "right", material: "solid" },
      back: { position: "back", material: "solid" },
    },
    floor: { material: "white_tile", pattern: "large_tiles" },
    lighting: { mood: "bright", type: "linear_led" },
    furniture,
    features: [`Capacidade: ${cap} pessoas`, "Mesa de Reunião", `Conjunto de ${cap} Cadeiras`],
    detectedAtmosphere: `Sala configurada para ${cap} pessoas com ambiente corporativo limpo.`,
    imageUrl: undefined,
    masterPrompt: defaultMasterPrompt,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    generatedAt: new Date().toISOString(),
    photoSourceCount: 0,
  }
}

/**
 * Pipeline de 2 Etapas:
 * Etapa 1: Análise Estrutural por Visão Computacional (VLM com triangulação multi-ângulo, desduplicação e orientação espacial).
 * Etapa 2: Síntese de Prompt Mestre Otimizado para o Gerador de Imagem 3D Isométrica.
 */
export async function buildIsometricRoomFromPhotos(
  input: BuildRoomVisionInput
): Promise<IsometricRoomModel> {
  const model = getAssistantChatModel()

  // Se o modelo de IA não estiver configurado no servidor, usa fallback procedural neutro
  if (!model || !input.imageUrls || input.imageUrls.length === 0) {
    return generateDefaultIsometricModel({
      name: input.roomName,
      capacity: input.capacity,
      floor: input.floor,
    })
  }

  const promptText = `
Você é um Especialista Sênior em Visão Computacional 3D, Fotogrametria Arquitetônica e Engenharia de Prompt para Maquetes Isométricas 3D de Alta Fidelidade.

SUA MISSÃO: Analisar minuciosamente o conjunto de fotos reais da sala (tiradas pelo usuário de DIVERSOS ÂNGULOS e posições) e construir o modelo 3D isométrico e o prompt mestre com fidelidade cirúrgica à realidade física do ambiente, sem poluição visual nem elementos fictícios.

======================================================================
1. REGRA SUPREMA DE CORTE EM "L" (STRICT 2-WALL CORNER CUTAWAY):
======================================================================
- A maquete 3D DEVE conterm ESTRITAMENTE APENAS 2 PAREDES DE FUNDO que se encontram no canto traseiro (Left Wall + Back Wall).
- A lateral direita e a frente da maquete DEVEM ser 100% ABERTAS (sem parede direita, sem meia-parede, sem janelas laterais de recorte, sem janelas externas com céu/nuvens).
- NUNCA renderize janelas residenciais ou externas na lateral direita.
- NUNCA renderize portas coladas na TV na parede esquerda (mantenha a parede da TV limpa e elegante).
- PROIBIÇÃO ABSOLUTA DE TETO: Corte 100% aberto no topo (open-top cutaway), sem laje, sem forro, sem fechamento superior.
- Paredes e paredes de vidro nao deve renderizar elementos atrás das mesmas, mesmo que contenhas na imagem deve ser ignorados no modelo 
- Antender ao posicionamento e orientaçã dos objetos mesmo que imagens de contexto de diversos angulos deve-se analisar o angulo para montar perfeitamente a maquete visual.

======================================================================
2. TOPOLOGIA ESPACIAL E ELEMENTOS REAIS DA SALA:
======================================================================

Para todos os modelos deve seguir a perfeita orientação espacial e caso nao identifique a topologia e ae memso quand identificar deve-se atender perfeitamente aos criterios de orientação
 - Atender mesas cadeiras, posicionamento e orientação real dos objetos 
 - Se tiver parede com plano de fundo e a mesma for apresentada no modelo garantir a reprodução exata sem alteração de autenticade 
 - Piso limpo, respeitando disposição e cor 
 - Posicionar objetos respeitando a proporção real e posição de cada objeto em relação aos outros. Podendo reorientar o angulo para que fique perfeito no modelo isométrico.

======================================================================
3. FIDELIDADE DE MARCAS, LOGOS E CONTAGEM EXATA:
======================================================================
- NUNCA invente fileiras extras ou matrizes de cadeiras para preencher o espaço. Se a sala tem cerca de 13 a 15 cadeiras no total, conte e especifique exatamente esse número.
- **ORIGINALIDADE E FIDELIDADE DE LOGOMARCAS**: Quando houver marcas, letreiros ou logos em murais/paredes (como o letreiro 'Cristallux LED' com seu símbolo original) mantenha o plano mas remova completamente o alogo e escrita.
- **CONTAGEM EXATA E ZERO ALUCINAÇÃO**: NUNCA invente fileiras extras ou matrizes de cadeiras para preencher o espaço. Se a sala tem cerca de 13 a 15 cadeiras no total, conte e especifique exatamente esse número.
- PROIBIDO adicionar plantas, vasos, quadros aleatórios, lixeiras, copos, papéis ou adesivos nos vidros.
- Fundo da imagem: Preto sólido absoluto (#000000), plataforma flutuando em isolamento total.

======================================================================
4. SELEÇÃO DE FOTOS DE REFERÊNCIA PARA IMAGE-TO-IMAGE (primaryReferenceIndexes):
======================================================================
As fotos originais serão passadas para um gerador de imagem-para-imagem que usa até 3 delas
como referência visual literal (para copiar com exatidão texturas, cores e a arte/logo do
mural). Você DEVE escolher, dentre as fotos recebidas (índice 0 = primeira foto, na ordem em
que foram enviadas), no máximo 3 índices, priorizando nesta ordem:
 1. A foto mais aberta/de canto que mostra as DUAS paredes do "L" (esquerda e fundo) juntas no
    mesmo enquadramento — ela é a âncora de orientação espacial (evita inverter/espelhar as
    paredes).
 2. Se houver mural, letreiro ou logo na parede do fundo, a foto mais nítida e frontal desse
    mural/logo — âncora de fidelidade exata de marca/tipografia.
 3. Uma foto que mostre claramente o layout geral dos móveis (mesa/cadeiras), se diferente das
    anteriores.
Se não for possível identificar índices claros, retorne um array vazio.

======================================================================
ESTRUTURA OBRIGATÓRIA DO "masterPrompt" (EM INGLÊS PARA O GERADOR 3D):
======================================================================
Preencha a estrutura abaixo em inglês com as características reais e contagens exatas da sala:

"A high-end 3D isometric cutaway diorama render of an office [tipo/nome da sala: ex: training classroom / corporate meeting room], floating in complete isolation against a solid pure black background (#000000).

Architectural Layout:
- Orthographic isometric perspective viewed from an elevated 45-degree angle from the front-left cutaway corner.
- Clean floor cutaway platform with [PISO REAL: ex: light gray polished concrete / porcelain tile].
- Strict 2-wall corner cutaway: EXACTLY two solid walls meeting at the back corner (one left wall and one back wall). Completely open front and open right side for clear unobstructed interior visibility.
- Absolutely NO ceiling, NO roof, NO right wall, NO front wall, NO exterior windows on the right.
- Left wall: [PAREDE ESQUERDA: ex: clean solid white wall with a mounted flat-screen TV and white split air-conditioner at the top].
- Back wall: [PAREDE DO FUNDO: ex: feature accent wall covered with a high-definition illuminated nighttime city skyline photo mural with the authentic backlit brand logo and exact typography 'Cristallux LED'].
- No exterior adjacent rooms, no exterior office desks, no outside corridors, no exterior people.

Furniture & Layout:
- Front / Stage Area: [MESA DO INSTRUTOR: ex: A minimalist white rectangular instructor desk placed at the front near the left-wall TV, with a black executive chair].
- Audience Seating: Exactly [CONTAGEM REAL: ex: 11] [MODELO: ex: black student training chairs with side light-wood writing tablet armrests and black metal frames], neatly arranged in 4 rows, ALL facing forward toward the left wall TV and instructor's desk.
- Wall Seating: [CADEIRAS DE APOIO SE HOUVER: ex: Exactly 3 black visitor chairs neatly aligned against the left wall under the TV / ou omitir se não houver].
- Empty, pristine, and perfectly organized room.

Lighting & Style:
- Clean architectural Octane 3D render style, realistic materials, soft ambient studio lighting, soft shadows on the floor.
- No loose clutter, no stickers or text decals on the glass, no red balls, no floating doors, no ceiling, no people.
- Avoid: ceiling, roof, overhead slab, right wall, partial side walls, windows with sky on the right, door next to tv, reversed chairs, extra chairs, duplicate furniture, background people."

======================================================================
FORMATO DE RESPOSTA (RETORNE EXCLUSIVAMENTE JSON VÁLIDO):
======================================================================
{
  "gridSize": { "width": 8, "depth": 8 },
  "detectedTopology": "training_auditorium | conference_meeting",
  "primaryReferenceIndexes": [0, 3],
  "detectedItems": {
    "floor": "Descrição do piso real",
    "leftWall": "Descrição da parede esquerda",
    "backWall": "Descrição da parede do fundo",
    "stage": "Descrição da área frontal do instrutor / mesa / TV",
    "chairs": "Descrição detalhada das cadeiras e contagem exata desduplicada",
    "supportChairs": "Cadeiras extras de apoio na parede se houver"
  },
  "walls": {
    "left": { "position": "left", "material": "solid | painted | wood_panel | glass | concrete" },
    "right": { "position": "right", "material": "solid | painted | glass" },
    "back": { "position": "back", "material": "solid | painted | wood_panel | glass" }
  },
  "floor": { "material": "concrete | white_tile | wood | carpet", "pattern": "plain | large_tiles | planks" },
  "lighting": { "mood": "bright | warm | soft", "type": "linear_led | recessed_spots | plain" },
  "furniture": [
    {
      "id": "item-1",
      "type": "desk | chair | tv_screen | air_conditioner",
      "x": 3,
      "y": 3,
      "rotation": 0,
      "label": "Nome do item real"
    }
  ],
  "features": ["Lista de características reais identificadas"],
  "detectedAtmosphere": "Descrição sucinta e fiel da sala analisada",
  "masterPrompt": "Prompt completo em inglês com contagem exata, orientação correta e especificações canônicas"
}

Dados informados pelo usuário para apoio:
Nome da sala: "${input.roomName ?? "Sala de Reunião"}"
Capacidade esperada: ${input.capacity ?? 8} pessoas
Andar: ${input.floor ?? 1}
Filial: "${input.filial ?? "Não especificada"}"
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
    console.log("Saida VLM", rawText)
    // Remove blocos de código \`\`\`json e \`\`\` se existirem
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

      const generatedUrl = await generateDioramaImage(promptToGenerate, MASTER_NEGATIVE_PROMPT)
      if (generatedUrl) {
        dioramaImageUrl = generatedUrl
      }
    }

    const fallback = generateDefaultIsometricModel({
      name: input.roomName,
      capacity: input.capacity,
      floor: input.floor,
    })

    // Sanitizar móveis para garantir que todos possuem id, type, x, y e rotation válidos
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
      rotation: [0, 90, 180, 270].includes(Number(item.rotation))
        ? (Number(item.rotation) as 0 | 90 | 180 | 270)
        : undefined,
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

