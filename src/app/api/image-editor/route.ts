import { type NextRequest, NextResponse } from 'next/server'
import { 
  redimensionarImagem, 
  adicionarFigurinha, 
  aplicarBlur, 
  recortarImagem,
  obterInfoImagem
} from '@/lib/image-editor'
import { z } from 'zod'

// Schema de validação para redimensionamento
const resizeSchema = z.object({
  caminhoEntrada: z.string().min(1),
  larguraDesejada: z.number().min(1).max(4000),
  alturaDesejada: z.number().min(1).max(4000),
  manterProporcao: z.boolean().default(true),
  qualidade: z.number().min(10).max(100).default(90)
})

// Schema de validação para figurinhas
const stickerSchema = z.object({
  caminhoFotoPrincipal: z.string().min(1),
  caminhoFigurinha: z.string().min(1),
  posicaoX: z.number().min(0),
  posicaoY: z.number().min(0),
  larguraFigurinha: z.number().min(1).optional(),
  opacidade: z.number().min(0.1).max(1.0).default(1.0)
})

// Schema de validação para blur
const blurSchema = z.object({
  caminhoEntrada: z.string().min(1),
  intensidade: z.number().min(1).max(50).default(10)
})

// Schema de validação para recorte
const cropSchema = z.object({
  caminhoEntrada: z.string().min(1),
  x: z.number().min(0),
  y: z.number().min(0),
  largura: z.number().min(1),
  altura: z.number().min(1)
})

// Schema de validação para informações da imagem
const infoSchema = z.object({
  caminhoEntrada: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { operacao: string; [key: string]: unknown }
    const { operacao } = body

    if (!operacao) {
      return NextResponse.json(
        { success: false, erro: 'Operação não especificada' },
        { status: 400 }
      )
    }

    switch (operacao) {
      case 'resize': {
        const params = resizeSchema.parse(body)
        const resultado = await redimensionarImagem({
          caminhoEntrada: params.caminhoEntrada,
          larguraDesejada: params.larguraDesejada,
          alturaDesejada: params.alturaDesejada,
          manterProporcao: params.manterProporcao,
          qualidade: params.qualidade
        })
        return NextResponse.json(resultado)
      }

      case 'sticker': {
        const params = stickerSchema.parse(body)
        const resultado = await adicionarFigurinha({
          caminhoFotoPrincipal: params.caminhoFotoPrincipal,
          caminhoFigurinha: params.caminhoFigurinha,
          posicaoX: params.posicaoX,
          posicaoY: params.posicaoY,
          larguraFigurinha: params.larguraFigurinha,
          opacidade: params.opacidade
        })
        return NextResponse.json(resultado)
      }

      case 'blur': {
        const params = blurSchema.parse(body)
        const resultado = await aplicarBlur(params.caminhoEntrada, params.intensidade)
        return NextResponse.json(resultado)
      }

      case 'crop': {
        const params = cropSchema.parse(body)
        const resultado = await recortarImagem(
          params.caminhoEntrada,
          params.x,
          params.y,
          params.largura,
          params.altura
        )
        return NextResponse.json(resultado)
      }

      case 'info': {
        const params = infoSchema.parse(body)
        const resultado = await obterInfoImagem(params.caminhoEntrada)
        return NextResponse.json(resultado)
      }

      default:
        return NextResponse.json(
          { success: false, erro: 'Operação não suportada' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro na API de edição de imagem:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          erro: 'Dados inválidos', 
          detalhes: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        erro: error instanceof Error ? error.message : 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de Edição de Imagem',
    operacoes: ['resize', 'sticker', 'blur', 'crop', 'info'],
    versao: '1.0.0'
  })
}
