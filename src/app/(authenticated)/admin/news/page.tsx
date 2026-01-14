"use client"

import { useState, useMemo, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import { MonacoEditor } from "@/components/ui/monaco-editor"
import {
  Newspaper,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Loader2,
  // eslint-disable-next-line
  Image as LucideIcon,
  Calendar,
  User,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UPLTButton } from "@/components/ui/uplt-button"
import Image from "next/image"
import type { Post } from "@prisma/client"

// Extend Post type to include images
interface PostWithImages extends Post {
  images?: Array<{ imageUrl: string }>
}

// Função utilitária para normalizar quebras de linha (CRLF -> LF)
function normalizeLineBreaks(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

/**
 * Renders the News Management page for listing, searching, creating, editing, and deleting company news posts with image upload and Markdown editing.
 *
 * @returns The News Management page React element.
 */
export default function NewsManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [createContent, setCreateContent] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editorHeight, setEditorHeight] = useState("500px")

  useEffect(() => {
    const handleResize = () => {
      setEditorHeight(window.innerWidth < 640 ? "300px" : "500px")
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

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

    const searchLower = searchTerm.toLowerCase()
    return posts.filter(post =>
      post.title.toLowerCase().includes(searchLower) ||
      !post.content.toLowerCase().includes(searchLower) ||
      !post.author.firstName?.toLowerCase().includes(searchLower) ||
      !post.author.lastName?.toLowerCase().includes(searchLower) ||
      !post.author.email.toLowerCase().includes(searchLower)
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
      content: normalizeLineBreaks(createContent || ""),
      published: true,
      imageUrl: fileUrl,
    })

    // Limpar o conteúdo após criar
    setCreateContent("")
  }

  const handleUpdatePost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingPost) return

    const formData = new FormData(e.currentTarget)

    updatePost.mutate({
      id: editingPost.id,
      title: formData.get("title") as string,
      content: normalizeLineBreaks(editContent || ""),
      published: true,
      imageUrl: fileUrl,
    })
  }

  // Atualizar conteúdo de edição quando o post for selecionado
  useEffect(() => {
    if (editingPost) {
      setEditContent(editingPost.content)
    }
  }, [editingPost])

  const handleDeletePost = (postId: string) => {
    if (confirm("Tem certeza que deseja excluir este post?")) {
      deletePost.mutate({ id: postId })
    }
  }

  // Verificar se tem acesso
  if (!hasAccess) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[40vh] px-4">
          <div className="text-center max-w-md">
            <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-bold">Acesso Negado</h3>
            <p className="mt-2 text-muted-foreground">
              Você não tem permissão para acessar esta página de gerenciamento de notícias.
            </p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Notícias</h2>
            <p className="text-muted-foreground">
              Publique e gerencie notícias e comunicados da empresa
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Nova Notícia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
              <form onSubmit={handleCreatePost} className="space-y-6">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-xl sm:text-2xl">Criar Nova Notícia</DialogTitle>
                  <DialogDescription className="text-sm">
                    Compartilhe uma novidade importante com a equipe. Use Markdown para formatar o conteúdo.
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
                    <Label htmlFor="create-content">Conteúdo (Markdown)</Label>
                    <MonacoEditor
                      value={createContent}
                      onChange={(value) => setCreateContent(value ?? "")}
                      height={editorHeight}
                      language="markdown"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use Markdown para formatar seu texto. Exemplos: **negrito**, *itálico*, # Título, etc.
                    </p>
                  </div>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={createPost.isPending || loading || !createContent.trim()}
                    className="w-full sm:w-auto"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">{filteredPosts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Views</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">
                {filteredPosts.reduce((sum, post) => sum + (post.viewCount), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Autores</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">
                {new Set(filteredPosts.map(post => post.authorId)).size}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Média</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">
                {filteredPosts.length > 0
                  ? Math.round(filteredPosts.reduce((sum, post) => sum + (post.viewCount), 0) / filteredPosts.length)
                  : 0
                }
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none sm:border shadow-none sm:shadow-sm">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Search className="h-5 w-5 shrink-0" />
              Buscar Notícias
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Digite o título, conteúdo ou autor para filtrar as notícias
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="mb-1.5 inline-block text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">Busca</Label>
                <Input
                  id="search"
                  placeholder="Digite para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-muted/50 border-none sm:border-input focus-visible:ring-1"
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full sm:w-auto font-medium">
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de posts */}
        <Card className="rounded-md border">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Notícias ({filteredPosts.length})
                </CardTitle>
                <CardDescription>
                  {isLoading ? "Carregando notícias..." : `${filteredPosts.length} notícia(s) encontrada(s)`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="divide-y p-0">
              {filteredPosts.map((post) => (
                <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Imagem Thumbnail */}
                    <div className="flex-shrink-0">
                      {(post.imageUrl ?? ((post as PostWithImages).images?.length ?? 0) > 0) ? (
                        <div className="relative h-16 w-16 sm:h-12 sm:w-12 rounded-md overflow-hidden bg-muted border">
                          <Image
                            src={
                              (post as PostWithImages).images?.[0]?.imageUrl ?? post.imageUrl ?? "/placeholder.svg"
                            }
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 sm:h-12 sm:w-12 rounded-md bg-muted border flex items-center justify-center">
                          <Newspaper className="h-6 w-6 sm:h-5 sm:w-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo Resumido */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-base sm:text-sm leading-tight text-foreground line-clamp-1">
                          {post.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{post.author.firstName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(post.createdAt, "dd/MM/yy", { locale: ptBR })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.viewCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingPost(post)}
                      title="Editar"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deletePost.isPending}
                      title="Excluir"
                    >
                      {deletePost.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium">Nenhuma notícia encontrada</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchTerm ? "Tente buscar por outros termos." : "Crie uma nova notícia para começar."}
              </p>
            </div>
          )}
        </Card>

        {/* Dialog de edição */}
        <Dialog open={!!editingPost} onOpenChange={(open) => {
          if (!open) {
            setEditingPost(null)
            setEditContent("")
          }
        }}>
          <DialogContent className="max-w-5xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
            {editingPost && (
              <form onSubmit={handleUpdatePost} className="space-y-6">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-xl sm:text-2xl">Editar Notícia</DialogTitle>
                  <DialogDescription className="text-sm">
                    Faça alterações nesta notícia. Use Markdown para formatar o conteúdo.
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
                    <Label htmlFor="edit-content">Conteúdo (Markdown)</Label>
                    <MonacoEditor
                      value={editContent}
                      onChange={(value) => setEditContent(value ?? "")}
                      height={editorHeight}
                      language="markdown"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use Markdown para formatar seu texto. Exemplos: **negrito**, *itálico*, # Título, etc.
                    </p>
                  </div>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={updatePost.isPending || loading || !editContent.trim()}
                    className="w-full sm:w-auto"
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