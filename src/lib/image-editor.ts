import Jimp from 'jimp'
import { join } from 'path'
import { tmpdir } from 'os'

/**
 * Interface para parâmetros de redimensionamento
 */
export interface ResizeParams {
  caminhoEntrada: string
  larguraDesejada: number
  alturaDesejada: number
  manterProporcao: boolean
  qualidade?: number
}

/**
 * Interface para parâmetros de adição de figurinhas
 */
export interface StickerParams {
  caminhoFotoPrincipal: string
  caminhoFigurinha: string
  posicaoX: number
  posicaoY: number
  larguraFigurinha?: number
  opacidade?: number
}

/**
 * Interface para resultado das operações
 */
export interface ImageOperationResult {
  success: boolean
  caminhoSaida?: string
  erro?: string
  dimensoes?: {
    largura: number
    altura: number
  }
}

/**
 * Redimensiona uma imagem usando Jimp
 * 
 * @param params - Parâmetros de redimensionamento
 * @returns Resultado da operação
 */
export async function redimensionarImagem(params: ResizeParams): Promise<ImageOperationResult> {
  try {
    const { caminhoEntrada, larguraDesejada, alturaDesejada, manterProporcao, qualidade = 90 } = params

    // Ler a imagem original
    const imagem = await Jimp.read(caminhoEntrada)

    // Aplicar redimensionamento baseado na flag manterProporcao
    if (manterProporcao) {
      // Manter proporção - usar a dimensão mais restritiva
      const proporcaoOriginal = imagem.bitmap.width / imagem.bitmap.height
      const proporcaoDesejada = larguraDesejada / alturaDesejada

      if (proporcaoOriginal > proporcaoDesejada) {
        // Imagem é mais larga - limitar pela largura
        imagem.resize(larguraDesejada, Jimp.AUTO)
      } else {
        // Imagem é mais alta - limitar pela altura
        imagem.resize(Jimp.AUTO, alturaDesejada)
      }
    } else {
      // Redimensionamento livre (pode distorcer)
      imagem.resize(larguraDesejada, alturaDesejada)
    }

    // Aplicar qualidade se especificada
    if (qualidade && qualidade > 0 && qualidade <= 100) {
      imagem.quality(qualidade)
    }

    // Gerar caminho de saída único
    const timestamp = Date.now()
    const extensao = caminhoEntrada.split('.').pop() ?? 'jpg'
    const caminhoSaida = join(tmpdir(), `imagem_redimensionada_${timestamp}.${extensao}`)

    // Salvar a imagem redimensionada
    await imagem.writeAsync(caminhoSaida)

    return {
      success: true,
      caminhoSaida,
      dimensoes: {
        largura: imagem.bitmap.width,
        altura: imagem.bitmap.height
      }
    }
  } catch (error) {
    return {
      success: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao redimensionar imagem'
    }
  }
}

/**
 * Adiciona uma figurinha (segunda imagem) sobre a imagem principal
 * 
 * @param params - Parâmetros de adição de figurinha
 * @returns Resultado da operação
 */
export async function adicionarFigurinha(params: StickerParams): Promise<ImageOperationResult> {
  try {
    const { 
      caminhoFotoPrincipal, 
      caminhoFigurinha, 
      posicaoX, 
      posicaoY, 
      larguraFigurinha,
      opacidade = 1.0 
    } = params

    // Ler ambas as imagens
    const fotoPrincipal = await Jimp.read(caminhoFotoPrincipal)
    const figurinha = await Jimp.read(caminhoFigurinha)

    // Redimensionar figurinha se especificado
    if (larguraFigurinha && larguraFigurinha > 0) {
      figurinha.resize(larguraFigurinha, Jimp.AUTO)
    }

    // Aplicar opacidade se especificada
    if (opacidade !== 1.0 && opacidade > 0 && opacidade <= 1.0) {
      figurinha.opacity(opacidade)
    }

    // Verificar se a figurinha cabe na imagem principal
    const larguraFigurinhaFinal = figurinha.bitmap.width
    const alturaFigurinhaFinal = figurinha.bitmap.height
    const larguraPrincipal = fotoPrincipal.bitmap.width
    const alturaPrincipal = fotoPrincipal.bitmap.height

    if (posicaoX + larguraFigurinhaFinal > larguraPrincipal || 
        posicaoY + alturaFigurinhaFinal > alturaPrincipal) {
      return {
        success: false,
        erro: 'A figurinha excede os limites da imagem principal'
      }
    }

    // Composição (mesclagem) das imagens
    fotoPrincipal.composite(figurinha, posicaoX, posicaoY)

    // Gerar caminho de saída único
    const timestamp = Date.now()
    const extensao = caminhoFotoPrincipal.split('.').pop() ?? 'jpg'
    const caminhoSaida = join(tmpdir(), `imagem_com_figurinha_${timestamp}.${extensao}`)

    // Salvar a imagem final
    await fotoPrincipal.writeAsync(caminhoSaida)

    return {
      success: true,
      caminhoSaida,
      dimensoes: {
        largura: fotoPrincipal.bitmap.width,
        altura: fotoPrincipal.bitmap.height
      }
    }
  } catch (error) {
    return {
      success: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao adicionar figurinha'
    }
  }
}

/**
 * Aplica um efeito de blur na imagem
 * 
 * @param caminhoEntrada - Caminho da imagem original
 * @param intensidade - Intensidade do blur (0-100)
 * @returns Resultado da operação
 */
export async function aplicarBlur(caminhoEntrada: string, intensidade = 10): Promise<ImageOperationResult> {
  try {
    const imagem = await Jimp.read(caminhoEntrada)
    
    // Aplicar blur
    imagem.blur(intensidade)

    // Gerar caminho de saída único
    const timestamp = Date.now()
    const extensao = caminhoEntrada.split('.').pop() ?? 'jpg'
    const caminhoSaida = join(tmpdir(), `imagem_blur_${timestamp}.${extensao}`)

    // Salvar a imagem com blur
    await imagem.writeAsync(caminhoSaida)

    return {
      success: true,
      caminhoSaida,
      dimensoes: {
        largura: imagem.bitmap.width,
        altura: imagem.bitmap.height
      }
    }
  } catch (error) {
    return {
      success: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao aplicar blur'
    }
  }
}

/**
 * Recorta uma imagem em uma área específica
 * 
 * @param caminhoEntrada - Caminho da imagem original
 * @param x - Posição X do recorte
 * @param y - Posição Y do recorte
 * @param largura - Largura do recorte
 * @param altura - Altura do recorte
 * @returns Resultado da operação
 */
export async function recortarImagem(
  caminhoEntrada: string, 
  x: number, 
  y: number, 
  largura: number, 
  altura: number
): Promise<ImageOperationResult> {
  try {
    const imagem = await Jimp.read(caminhoEntrada)
    
    // Verificar se as dimensões do recorte são válidas
    if (x < 0 || y < 0 || largura <= 0 || altura <= 0) {
      return {
        success: false,
        erro: 'Dimensões de recorte inválidas'
      }
    }

    if (x + largura > imagem.bitmap.width || y + altura > imagem.bitmap.height) {
      return {
        success: false,
        erro: 'O recorte excede os limites da imagem original'
      }
    }

    // Aplicar recorte
    imagem.crop(x, y, largura, altura)

    // Gerar caminho de saída único
    const timestamp = Date.now()
    const extensao = caminhoEntrada.split('.').pop() ?? 'jpg'
    const caminhoSaida = join(tmpdir(), `imagem_recortada_${timestamp}.${extensao}`)

    // Salvar a imagem recortada
    await imagem.writeAsync(caminhoSaida)

    return {
      success: true,
      caminhoSaida,
      dimensoes: {
        largura: imagem.bitmap.width,
        altura: imagem.bitmap.height
      }
    }
  } catch (error) {
    return {
      success: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao recortar imagem'
    }
  }
}

/**
 * Obtém informações sobre uma imagem
 * 
 * @param caminhoEntrada - Caminho da imagem
 * @returns Informações da imagem
 */
export async function obterInfoImagem(caminhoEntrada: string): Promise<{
  success: boolean
  largura?: number
  altura?: number
  formato?: string
  erro?: string
}> {
  try {
    const imagem = await Jimp.read(caminhoEntrada)
    
    return {
      success: true,
      largura: imagem.bitmap.width,
      altura: imagem.bitmap.height,
      formato: imagem.getMIME()
    }
  } catch (error) {
    return {
      success: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao obter informações da imagem'
    }
  }
}
