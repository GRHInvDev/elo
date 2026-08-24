import { z } from "zod"

export type WallMaterial = "solid" | "glass" | "window" | "brick" | "wood_panel" | "white_wall"
export type FloorMaterial = "white_tile" | "wood" | "carpet" | "tile" | "dark_tile" | "concrete"
export type FurnitureType =
  | "round_glass_table"
  | "round_table"
  | "conference_table"
  | "desk"
  | "chair"
  | "executive_chair"
  | "visitor_chair"
  | "tv_screen"
  | "whiteboard"
  | "plant"
  | "projector"
  | "door"
  | "bookshelf"
  | "couch"
  | "water_cooler"
  | "air_conditioner"
  | "ceiling_light"

export interface IsometricFurnitureItem {
  id: string
  type: FurnitureType
  x: number
  y: number
  width?: number
  depth?: number
  rotation?: 0 | 90 | 180 | 270
  wall?: "left" | "right" | "back"
  color?: string
  material?: string
  label?: string
}

export interface IsometricWall {
  position: "left" | "right" | "back"
  material: WallMaterial
  color?: string
  accent?: boolean
  hasWoodPanel?: boolean
  woodPanelWidth?: number
  hasOfficeView?: boolean
}

export interface IsometricFloor {
  material: FloorMaterial
  color?: string
  pattern?: "checkered" | "stripes" | "plain" | "large_tiles"
}

export interface IsometricRoomModel {
  gridSize: {
    width: number // e.g. 5 - 10
    depth: number // e.g. 5 - 10
  }
  walls: {
    left: IsometricWall
    right: IsometricWall
    back?: IsometricWall
  }
  floor: IsometricFloor
  lighting?: {
    mood?: "bright" | "warm" | "cyber" | "soft"
    type?: "linear_led" | "spotlights" | "plain"
    ceilingLights?: number
  }
  ceiling?: {
    type?: "linear_led" | "spotlights" | "plain"
    color?: string
  }
  furniture: IsometricFurnitureItem[]
  features: string[]
  detectedAtmosphere?: string
  imageUrl?: string
  masterPrompt?: string
  negativePrompt?: string
  generatedAt?: string
  photoSourceCount?: number
}

// Zod Schema para validação e geração estruturada com IA
export const isometricFurnitureItemSchema = z.object({
  id: z.string().describe("Identificador único do item"),
  type: z.string().describe("Tipo do móvel ou elemento decorativo"),
  x: z.number().describe("Posição X na grade do chão"),
  y: z.number().describe("Posição Y na grade do chão"),
  width: z.number().optional().describe("Largura ocupada em células da grade"),
  depth: z.number().optional().describe("Profundidade ocupada em células da grade"),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).optional().describe("Orientação do item em graus"),
  wall: z.enum(["left", "right", "back"]).optional().describe("Parede onde o item está montado (ex: TV montada na parede esquerda)"),
  color: z.string().optional().describe("Cor predominante em hex ou nome"),
  material: z.string().optional().describe("Material do item (ex.: black_glass, wood_slat, black_leather, chrome)"),
  label: z.string().optional().describe("Rótulo descritivo do item"),
})

export const isometricWallSchema = z.object({
  position: z.enum(["left", "right", "back"]).describe("Posição da parede na perspectiva isométrica"),
  material: z.string().describe("Material da parede"),
  color: z.string().optional().describe("Cor da parede"),
  accent: z.boolean().optional().describe("Se a parede possui painel de destaque/acústico"),
  hasWoodPanel: z.boolean().optional().describe("Se a parede possui painel ripado de madeira"),
  hasOfficeView: z.boolean().optional().describe("Se é vidro com vista para o open space do escritório"),
})

export const isometricRoomModelSchema = z.object({
  gridSize: z.object({
    width: z.number().int().min(2).max(20).describe("Largura da sala em blocos isométricos"),
    depth: z.number().int().min(2).max(20).describe("Profundidade da sala em blocos isométricos"),
  }),
  walls: z.object({
    left: isometricWallSchema.describe("Parede esquerda"),
    right: isometricWallSchema.describe("Parede direita"),
    back: isometricWallSchema.optional().describe("Parede de fundo"),
  }),
  floor: z.object({
    material: z.string().describe("Tipo de piso"),
    color: z.string().optional().describe("Cor do piso"),
    pattern: z.string().optional().describe("Padrão do piso"),
  }),
  lighting: z.object({
    mood: z.string().optional().describe("Clima de iluminação"),
    type: z.string().optional().describe("Tipo de luminária"),
    ceilingLights: z.number().optional().describe("Quantidade de luminárias no teto"),
  }).optional(),
  ceiling: z.object({
    type: z.string().optional(),
    color: z.string().optional(),
  }).optional(),
  furniture: z.array(isometricFurnitureItemSchema).describe("Móveis identificados na sala com posições exatas no grid"),
  features: z.array(z.string()).describe("Lista de recursos identificados (TV, Mesa Redonda de Vidro, Parede de Vidro, Ar Condicionado, etc.)"),
  detectedAtmosphere: z.string().optional().describe("Descrição precisa do ambiente reconstruído"),
  imageUrl: z.string().optional().describe("URL da maquete 3D isométrica gerada"),
  masterPrompt: z.string().optional().describe("Prompt mestre sintetizado em inglês para o gerador de imagem 3D"),
  negativePrompt: z.string().optional().describe("Negative prompt com regras de bloqueio de artefatos"),
})

export type IsometricRoomModelInput = z.infer<typeof isometricRoomModelSchema>
