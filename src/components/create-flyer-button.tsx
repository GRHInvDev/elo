"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileImage, Loader2 } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { UPLTButton } from "./ui/uplt-button"

export function CreateFlyerButton() {
  // Estados para cada campo do formulário
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [iframe, setIframe] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  
  // Estados de UI
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageUploaded, setImageUploaded] = useState(false)
  
  const { toast } = useToast()
  const utils = api.useUtils()
  const sendRef = useRef<(() => Promise<void>) | undefined>()

  const createFlyer = api.flyer.create.useMutation({
    onSuccess: async () => {
      toast({
        title: "Encarte criado",
        description: "O encarte foi criado com sucesso.",
      })
      resetForm()
      setOpen(false)
      await utils.flyer.list.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Função para resetar o formulário
  const resetForm = () => {
    setTitle("")
    setDescription("")
    setIframe("")
    setFileUrl("")
    setImageUploaded(false)
  }

  // Função para lidar com a URL da imagem gerada
  const handleImageUrlGenerated = (url: string) => {
    setFileUrl(url)
    setImageUploaded(true)
    toast({
      title: "Imagem carregada",
      description: "A imagem foi carregada com sucesso.",
    })
  }

  // Função para lidar com o upload da imagem
  const handleImageUpload = async () => {
    if (!imageUploaded && sendRef.current) {
      setLoading(true)
      try {
        toast({
          title: "Enviando imagem",
          description: "Aguarde enquanto enviamos a imagem...",
        })
        
        await sendRef.current()
        
        // Se após o upload ainda não temos a URL, aguardar um pouco
        if (!fileUrl) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        return true
      } catch (error) {
        toast({
          title: "Erro no upload",
          description: `Não foi possível fazer o upload da imagem. ${JSON.stringify(error)}`,
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    }
    
    return imageUploaded // Já está carregada
  }

  // Função para enviar o formulário
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!title || !description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)
    
    try {
      // Primeiro, garantir que a imagem está carregada
      const imageReady = await handleImageUpload()
      
      if (!imageReady || !fileUrl) {
        toast({
          title: "Imagem não carregada",
          description: "É necessário carregar uma imagem para o encarte.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }
      
      // Agora podemos criar o flyer com todos os dados disponíveis
      await createFlyer.mutateAsync({
        title,
        description,
        iframe,
        imageUrl: fileUrl,
        published: true,
      })
    } catch (error) {
      console.error("Erro ao criar encarte:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o encarte.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Resetar o formulário quando o diálogo for fechado
  const handleDialogChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      resetForm()
    }
  }

  // Verificar se o formulário está pronto para envio
  const isFormValid = title && description && (imageUploaded || fileUrl)

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button>
          <FileImage className="mr-2 h-4 w-4" />
          Criar Encarte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader className='flex justify-between flex-row'>
            <div>
              <DialogTitle>Novo Encarte</DialogTitle>
              <DialogDescription>Crie um novo encarte para a empresa</DialogDescription>
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input 
                id="title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título do encarte" 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="iframe">Link do PDF</Label>
              <Input 
                id="iframe" 
                value={iframe}
                onChange={(e) => setIframe(e.target.value)}
                placeholder="Digite o valor src do iframe" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Digite a descrição do encarte" 
                required 
              />
            </div>
          </div>
          <div className="grid gap-2 mb-4">
            <Label htmlFor="imageUrl">Imagem</Label>
            <UPLTButton
              sendRef={sendRef}
              onImageUrlGenerated={handleImageUrlGenerated}
              onUploadBegin={()=>{
                toast({
                  title: "Anexando imagem",
                  description: "Estamos anexando sua imagem.",
                })
              }}
              onUploadError={(error: Error) => {
                toast({
                  title: "Erro",
                  description: error.message,
                  variant: "destructive",
                })
              }}
            />
            {imageUploaded && (
              <p className="text-sm text-green-600">✓ Imagem carregada com sucesso</p>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={!isFormValid || createFlyer.isPending || loading}
          >
            {(createFlyer.isPending || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Encarte
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}