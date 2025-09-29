import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ImageOperationResult {
  success: boolean
  caminhoSaida?: string
  erro?: string
  dimensoes?: {
    largura: number
    altura: number
  }
}

interface ImageInfo {
  success: boolean
  largura?: number
  altura?: number
  formato?: string
  erro?: string
}

interface ResizeParams {
  caminhoEntrada: string
  larguraDesejada: number
  alturaDesejada: number
  manterProporcao: boolean
  qualidade?: number
}

interface StickerParams {
  caminhoFotoPrincipal: string
  caminhoFigurinha: string
  posicaoX: number
  posicaoY: number
  larguraFigurinha?: number
  opacidade?: number
}

interface CropParams {
  caminhoEntrada: string
  x: number
  y: number
  largura: number
  altura: number
}

interface BlurParams {
  caminhoEntrada: string
  intensidade: number
}

export function useImageEditor() {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const processImage = useCallback(async (
    operacao: string, 
    params: ResizeParams | StickerParams | BlurParams | CropParams
  ): Promise<ImageOperationResult> => {
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/image-editor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operacao,
          ...params
        })
      })

      const resultado = await response.json() as ImageOperationResult

      if (!response.ok) {
        throw new Error(resultado.erro ?? 'Erro na requisição')
      }

      return resultado
    } catch (error) {
      const erro = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        erro
      }
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const redimensionarImagem = useCallback(async (params: ResizeParams): Promise<ImageOperationResult> => {
    const resultado = await processImage('resize', params)
    
    if (resultado.success) {
      toast({
        title: "Imagem redimensionada",
        description: "A imagem foi redimensionada com sucesso!",
      })
    } else {
      toast({
        title: "Erro",
        description: resultado.erro ?? "Erro ao redimensionar imagem",
        variant: "destructive",
      })
    }

    return resultado
  }, [processImage, toast])

  const adicionarFigurinha = useCallback(async (params: StickerParams): Promise<ImageOperationResult> => {
    const resultado = await processImage('sticker', params)
    
    if (resultado.success) {
      toast({
        title: "Figurinha adicionada",
        description: "A figurinha foi adicionada com sucesso!",
      })
    } else {
      toast({
        title: "Erro",
        description: resultado.erro ?? "Erro ao adicionar figurinha",
        variant: "destructive",
      })
    }

    return resultado
  }, [processImage, toast])

  const aplicarBlur = useCallback(async (params: BlurParams): Promise<ImageOperationResult> => {
    const resultado = await processImage('blur', params)
    
    if (resultado.success) {
      toast({
        title: "Blur aplicado",
        description: "O efeito blur foi aplicado com sucesso!",
      })
    } else {
      toast({
        title: "Erro",
        description: resultado.erro ?? "Erro ao aplicar blur",
        variant: "destructive",
      })
    }

    return resultado
  }, [processImage, toast])

  const recortarImagem = useCallback(async (params: CropParams): Promise<ImageOperationResult> => {
    const resultado = await processImage('crop', params)
    
    if (resultado.success) {
      toast({
        title: "Imagem recortada",
        description: "A imagem foi recortada com sucesso!",
      })
    } else {
      toast({
        title: "Erro",
        description: resultado.erro ?? "Erro ao recortar imagem",
        variant: "destructive",
      })
    }

    return resultado
  }, [processImage, toast])

  const obterInfoImagem = useCallback(async (caminhoEntrada: string): Promise<ImageInfo> => {
    try {
      const response = await fetch('/api/image-editor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operacao: 'info',
          caminhoEntrada
        })
      })

      const resultado = await response.json() as ImageInfo

      if (!response.ok) {
        throw new Error(resultado.erro ?? 'Erro na requisição')
      }

      return resultado
    } catch (error) {
      const erro = error instanceof Error ? error.message : 'Erro desconhecido'
      return {
        success: false,
        erro
      }
    }
  }, [])

  return {
    isProcessing,
    redimensionarImagem,
    adicionarFigurinha,
    aplicarBlur,
    recortarImagem,
    obterInfoImagem
  }
}
