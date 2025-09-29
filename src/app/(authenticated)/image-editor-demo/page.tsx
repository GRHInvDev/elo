"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { ImageEditor } from "@/components/image-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon, Upload } from "lucide-react"
import Image from "next/image"

export default function ImageEditorDemoPage() {
  const [imagemEditada, setImagemEditada] = useState<string | null>(null)
  const [imagemOriginal, setImagemOriginal] = useState<string | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file?.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setImagemOriginal(url)
      setImagemEditada(url)
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Editor de Imagem - Demo</h1>
          <p className="text-muted-foreground">
            Teste as funcionalidades de edição de imagem: redimensionamento, recorte, blur e adição de figurinhas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload de Imagem */}
          <Card>
            <CardHeader>
              <CardTitle>1. Carregar Imagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <div className="w-full h-32 border-dashed border-2 border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar uma imagem
                    </p>
                  </div>
                </div>
              </label>

              {imagemOriginal && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Imagem Original:</p>
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                    <Image
                      src={imagemOriginal}
                      alt="Imagem original"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editor de Imagem */}
          <Card>
            <CardHeader>
              <CardTitle>2. Editar Imagem</CardTitle>
            </CardHeader>
            <CardContent>
              {imagemOriginal ? (
                <ImageEditor
                  imagemOriginal={imagemOriginal}
                  onImagemEditada={(novaUrl) => setImagemEditada(novaUrl)}
                >
                  <Button className="w-full">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Abrir Editor
                  </Button>
                </ImageEditor>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Selecione uma imagem primeiro</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resultado */}
        {imagemEditada && (
          <Card>
            <CardHeader>
              <CardTitle>3. Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Imagem Original:</p>
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                      <Image
                        src={imagemOriginal ?? ''}
                        alt="Imagem original"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Imagem Editada:</p>
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                      <Image
                        src={imagemEditada}
                        alt="Imagem editada"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = imagemEditada
                      link.download = 'imagem-editada.jpg'
                      link.click()
                    }}
                  >
                    Baixar Imagem Editada
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImagemEditada(imagemOriginal)
                    }}
                  >
                    Restaurar Original
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Funcionalidades */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Redimensionamento</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ajustar largura e altura</li>
                  <li>• Manter proporção</li>
                  <li>• Controlar qualidade</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Recorte</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Definir área de recorte</li>
                  <li>• Coordenadas precisas</li>
                  <li>• Validação de limites</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Efeito Blur</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Intensidade ajustável</li>
                  <li>• Efeito suave</li>
                  <li>• Ideal para fundos</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Figurinhas</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Adicionar imagens sobrepostas</li>
                  <li>• Controlar posição e tamanho</li>
                  <li>• Ajustar opacidade</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
