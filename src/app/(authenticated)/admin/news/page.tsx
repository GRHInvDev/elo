"use client"

import { useState, useMemo } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import {
  Newspaper,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Loader2,
  Image as ImageIcon,
  Calendar,
  User,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UPLTButton } from "@/components/ui/uplt-button"
import Image from "next/image"
import type { Post } from "@prisma/client"

// Função utilitária para normalizar quebras de linha (CRLF -> LF)
function normalizeLineBreaks(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

export default function NewsManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const { isSudo, hasAdminAccess } = useAccessControl()
  const { toast } = useToast()

  // Verificar se tem acesso à página de news
  const hasAccess = isSudo || hasAdminAccess("/admin/news")

  // Queries
  const { data: posts, isLoading, refetch } = api.post.listAll.useQuery()
  // Mutations
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      toast({
        title: "Post criado",
        description: "O post foi criado com sucesso.",
      })
      setIsCreateDialogOpen(false)
      setFileUrl(undefined)
      await refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updatePost = api.post.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Post atualizado",
        description: "O post foi atualizado com sucesso.",
      })
      setEditingPost(null)
      setFileUrl(undefined)
      await refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const deletePost = api.post.delete.useMutation({
    onSuccess: async () => {
      toast({
        title: "Post excluído",
        description: "O post foi excluído com sucesso.",
      })
      await refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Filtrar posts baseado na busca
  const filteredPosts = useMemo(() => {
    if (!posts) return []
    if (!searchTerm) return posts

    return posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      !!!post.author.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      !!!post.author.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [posts, searchTerm])

  // Handlers
  const handleImageUrlGenerated = (url: string) => {
    setFileUrl(url)
    toast({
      title: "Imagem carregada",
      description: "A imagem foi carregada com sucesso.",
    })
    setLoading(false)
  }

  const handleCreatePost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    createPost.mutate({
      title: formData.get("title") as string,
      content: normalizeLineBreaks(formData.get("content") as string),
      published: true,
      imageUrl: fileUrl,
    })
  }

  const handleUpdatePost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingPost) return

    const formData = new FormData(e.currentTarget)

    updatePost.mutate({
      id: editingPost.id,
      title: formData.get("title") as string,
      content: normalizeLineBreaks(formData.get("content") as string),
      published: true,
      imageUrl: fileUrl,
    })
  }

  const handleDeletePost = (postId: string) => {
    if (confirm("Tem certeza que deseja excluir este post?")) {
      deletePost.mutate({ id: postId })
    }
  }

  // Verificar se tem acesso
  if (!hasAccess) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Acesso Negado</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Notícias</h2>
            <p className="text-muted-foreground">
              Publique e gerencie notícias e comunicados da empresa
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Notícia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleCreatePost}>
                <DialogHeader>
                  <DialogTitle>Criar Nova Notícia</DialogTitle>
                  <DialogDescription>
                    Compartilhe uma novidade importante com a equipe
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="create-title">Título</Label>
                    <Input
                      id="create-title"
                      name="title"
                      placeholder="Digite o título da notícia"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Imagem (opcional)</Label>
                    <UPLTButton
                      onImageUrlGenerated={handleImageUrlGenerated}
                      onUploadBegin={() => {
                        setLoading(true)
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
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="create-content">Conteúdo</Label>
                    <Textarea
                      id="create-content"
                      name="content"
                      placeholder="Digite o conteúdo da notícia. Pressione Enter para criar quebras de linha."
                      rows={6}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createPost.isPending || loading}
                  >
                    {createPost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Publicar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Insights/estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total de Notícias</span>
              </div>
              <div className="text-2xl font-bold">{filteredPosts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total de Visualizações</span>
              </div>
              <div className="text-2xl font-bold">
                {filteredPosts.reduce((sum, post) => sum + (post.viewCount), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total de Autores</span>
              </div>
              <div className="text-2xl font-bold">
                {new Set(filteredPosts.map(post => post.authorId)).size}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Média Visualizações</span>
              </div>
              <div className="text-2xl font-bold">
                {filteredPosts.length > 0
                  ? Math.round(filteredPosts.reduce((sum, post) => sum + (post.viewCount), 0) / filteredPosts.length)
                  : 0
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campo de busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Notícias
            </CardTitle>
            <CardDescription>
              Digite o título, conteúdo ou autor para filtrar as notícias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Busca</Label>
                <Input
                  id="search"
                  placeholder="Digite para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Notícias ({filteredPosts.length})
            </CardTitle>
            <CardDescription>
              {isLoading ? "Carregando notícias..." : `${filteredPosts.length} notícia(s) encontrada(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Carregando notícias...</p>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Imagem do post */}
                        <div className="flex-shrink-0">
                          {post.imageUrl ? (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                              <Image
                                src={post.imageUrl}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Conteúdo do post */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate">{post.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {post.content}
                              </p>
                            </div>
                          </div>

                          {/* Metadados */}
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {post.author.firstName} {post.author.lastName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(post.createdAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {post.viewCount} visualizações
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPost(post)}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deletePost.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            {deletePost.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhuma notícia encontrada para este filtro." : "Nenhuma notícia publicada ainda."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de edição */}
        <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
          <DialogContent className="max-w-2xl">
            {editingPost && (
              <form onSubmit={handleUpdatePost}>
                <DialogHeader>
                  <DialogTitle>Editar Notícia</DialogTitle>
                  <DialogDescription>
                    Faça alterações nesta notícia
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Título</Label>
                    <Input
                      id="edit-title"
                      name="title"
                      defaultValue={editingPost.title}
                      placeholder="Digite o título da notícia"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Imagem (opcional)</Label>
                    <UPLTButton
                      onImageUrlGenerated={handleImageUrlGenerated}
                      onUploadBegin={() => {
                        setLoading(true)
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
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-content">Conteúdo</Label>
                    <Textarea
                      id="edit-content"
                      name="content"
                      defaultValue={editingPost.content}
                      placeholder="Digite o conteúdo da notícia. Pressione Enter para criar quebras de linha."
                      rows={6}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={updatePost.isPending || loading}
                  >
                    {updatePost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Atualizar
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}