"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Crop, 
  Image as ImageIcon, 
  Maximize2, 
  Smile, 
  Upload, 
  Download,
  RotateCcw,
  Zap,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useImageEditor } from "@/hooks/use-image-editor"
import Image from "next/image"

interface ImageEditorProps {
  imagemOriginal?: string
  onImagemEditada?: (caminhoSaida: string) => void
  children?: React.ReactNode
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ImageEditor({ imagemOriginal, onImagemEditada, children }: ImageEditorProps) {
  const [imagemAtual, setImagemAtual] = useState<string | undefined>(imagemOriginal)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 })
  const [resizeParams, setResizeParams] = useState({
    largura: 800,
    altura: 600,
    manterProporcao: true,
    qualidade: 90
  })
  const [stickerParams, setStickerParams] = useState({
    posicaoX: 0,
    posicaoY: 0,
    larguraFigurinha: 100,
    opacidade: 1.0
  })
  const [blurIntensidade, setBlurIntensidade] = useState(10)
  const [figurinhaFile, setFigurinhaFile] = useState<File | null>(null)
  const [figurinhaPreview, setFigurinhaPreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stickerInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { 
    isProcessing, 
    redimensionarImagem, 
    adicionarFigurinha, 
    aplicarBlur, 
    recortarImagem 
  } = useImageEditor()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file?.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setImagemAtual(url)
    }
  }

  const handleStickerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file?.type.startsWith('image/')) {
      setFigurinhaFile(file)
      const url = URL.createObjectURL(file)
      setFigurinhaPreview(url)
    }
  }

  const handleResize = async () => {
    if (!imagemAtual) return
    
    const resultado = await redimensionarImagem({
      caminhoEntrada: imagemAtual,
      larguraDesejada: resizeParams.largura,
      alturaDesejada: resizeParams.altura,
      manterProporcao: resizeParams.manterProporcao,
      qualidade: resizeParams.qualidade
    })
    
    if (resultado.success && resultado.caminhoSaida) {
      setImagemAtual(resultado.caminhoSaida)
      onImagemEditada?.(resultado.caminhoSaida)
    }
  }

  const handleCrop = async () => {
    if (!imagemAtual) return
    
    const resultado = await recortarImagem({
      caminhoEntrada: imagemAtual,
      x: cropArea.x,
      y: cropArea.y,
      largura: cropArea.width,
      altura: cropArea.height
    })
    
    if (resultado.success && resultado.caminhoSaida) {
      setImagemAtual(resultado.caminhoSaida)
      onImagemEditada?.(resultado.caminhoSaida)
    }
  }

  const handleBlur = async () => {
    if (!imagemAtual) return
    
    const resultado = await aplicarBlur({
      caminhoEntrada: imagemAtual,
      intensidade: blurIntensidade
    })
    
    if (resultado.success && resultado.caminhoSaida) {
      setImagemAtual(resultado.caminhoSaida)
      onImagemEditada?.(resultado.caminhoSaida)
    }
  }

  const handleAddSticker = async () => {
    if (!figurinhaFile || !imagemAtual) {
      toast({
        title: "Erro",
        description: "Selecione uma figurinha e uma imagem primeiro",
        variant: "destructive",
      })
      return
    }
    
    // Em produção, seria necessário fazer upload da figurinha primeiro
    // Por agora, vamos simular com um caminho
    const resultado = await adicionarFigurinha({
      caminhoFotoPrincipal: imagemAtual,
      caminhoFigurinha: figurinhaPreview ?? '',
      posicaoX: stickerParams.posicaoX,
      posicaoY: stickerParams.posicaoY,
      larguraFigurinha: stickerParams.larguraFigurinha,
      opacidade: stickerParams.opacidade
    })
    
    if (resultado.success && resultado.caminhoSaida) {
      setImagemAtual(resultado.caminhoSaida)
      onImagemEditada?.(resultado.caminhoSaida)
    }
  }

  const resetImage = () => {
    setImagemAtual(imagemOriginal)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline">
            <ImageIcon className="h-4 w-4 mr-2" />
            Editar Imagem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor de Imagem</DialogTitle>
          <DialogDescription>
            Edite suas imagens com ferramentas de recorte, redimensionamento e adição de figurinhas
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview da Imagem */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {imagemAtual ? (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                    <Image
                      src={imagemAtual}
                      alt="Imagem sendo editada"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma imagem selecionada</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload de Nova Imagem */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Carregar Imagem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Imagem
                  </Button>
                  
                  {imagemAtual && (
                    <Button
                      variant="outline"
                      onClick={resetImage}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar Original
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ferramentas de Edição */}
          <div className="space-y-4">
            <Tabs defaultValue="resize" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="resize">Redimensionar</TabsTrigger>
                <TabsTrigger value="crop">Recortar</TabsTrigger>
                <TabsTrigger value="blur">Blur</TabsTrigger>
                <TabsTrigger value="sticker">Figurinha</TabsTrigger>
              </TabsList>

              {/* Redimensionamento */}
              <TabsContent value="resize" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Redimensionar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="largura">Largura (px)</Label>
                        <Input
                          id="largura"
                          type="number"
                          value={resizeParams.largura}
                          onChange={(e) => setResizeParams(prev => ({ 
                            ...prev, 
                            largura: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="altura">Altura (px)</Label>
                        <Input
                          id="altura"
                          type="number"
                          value={resizeParams.altura}
                          onChange={(e) => setResizeParams(prev => ({ 
                            ...prev, 
                            altura: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Qualidade ({resizeParams.qualidade}%)</Label>
                      <Slider
                        value={[resizeParams.qualidade]}
                        onValueChange={([value]) => setResizeParams(prev => ({ 
                          ...prev, 
                          qualidade: value ?? 90
                        }))}
                        max={100}
                        min={10}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="manter-proporcao"
                        checked={resizeParams.manterProporcao}
                        onCheckedChange={(checked) => setResizeParams(prev => ({ 
                          ...prev, 
                          manterProporcao: checked 
                        }))}
                      />
                      <Label htmlFor="manter-proporcao">Manter proporção</Label>
                    </div>

                    <Button 
                      onClick={handleResize} 
                      disabled={isProcessing || !imagemAtual}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Maximize2 className="h-4 w-4 mr-2" />
                      )}
                      Redimensionar
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recorte */}
              <TabsContent value="crop" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recortar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="crop-x">Posição X (px)</Label>
                        <Input
                          id="crop-x"
                          type="number"
                          value={cropArea.x}
                          onChange={(e) => setCropArea(prev => ({ 
                            ...prev, 
                            x: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="crop-y">Posição Y (px)</Label>
                        <Input
                          id="crop-y"
                          type="number"
                          value={cropArea.y}
                          onChange={(e) => setCropArea(prev => ({ 
                            ...prev, 
                            y: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="crop-width">Largura (px)</Label>
                        <Input
                          id="crop-width"
                          type="number"
                          value={cropArea.width}
                          onChange={(e) => setCropArea(prev => ({ 
                            ...prev, 
                            width: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="crop-height">Altura (px)</Label>
                        <Input
                          id="crop-height"
                          type="number"
                          value={cropArea.height}
                          onChange={(e) => setCropArea(prev => ({ 
                            ...prev, 
                            height: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleCrop} 
                      disabled={isProcessing || !imagemAtual}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Crop className="h-4 w-4 mr-2" />
                      )}
                      Recortar
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Blur */}
              <TabsContent value="blur" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Efeito Blur</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Intensidade do Blur ({blurIntensidade})</Label>
                      <Slider
                        value={[blurIntensidade]}
                        onValueChange={([value]) => setBlurIntensidade(value ?? 10)}
                        max={50}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <Button 
                      onClick={handleBlur} 
                      disabled={isProcessing || !imagemAtual}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Aplicar Blur
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Figurinhas */}
              <TabsContent value="sticker" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Adicionar Figurinha</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Upload de Figurinha */}
                    <div className="space-y-2">
                      <Label>Selecionar Figurinha</Label>
                      <Input
                        ref={stickerInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleStickerUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => stickerInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Figurinha
                      </Button>
                      
                      {figurinhaPreview && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                          <Image
                            src={figurinhaPreview}
                            alt="Preview da figurinha"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Posicionamento */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sticker-x">Posição X (px)</Label>
                        <Input
                          id="sticker-x"
                          type="number"
                          value={stickerParams.posicaoX}
                          onChange={(e) => setStickerParams(prev => ({ 
                            ...prev, 
                            posicaoX: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sticker-y">Posição Y (px)</Label>
                        <Input
                          id="sticker-y"
                          type="number"
                          value={stickerParams.posicaoY}
                          onChange={(e) => setStickerParams(prev => ({ 
                            ...prev, 
                            posicaoY: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    </div>

                    {/* Tamanho e Opacidade */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sticker-width">Largura (px)</Label>
                        <Input
                          id="sticker-width"
                          type="number"
                          value={stickerParams.larguraFigurinha}
                          onChange={(e) => setStickerParams(prev => ({ 
                            ...prev, 
                            larguraFigurinha: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Opacidade ({Math.round(stickerParams.opacidade * 100)}%)</Label>
                        <Slider
                          value={[stickerParams.opacidade]}
                          onValueChange={([value]) => setStickerParams(prev => ({ 
                            ...prev, 
                            opacidade: value ?? 1.0
                          }))}
                          max={1}
                          min={0.1}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleAddSticker} 
                      disabled={isProcessing || !imagemAtual || !figurinhaFile}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Smile className="h-4 w-4 mr-2" />
                      )}
                      Adicionar Figurinha
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Baixar Imagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
