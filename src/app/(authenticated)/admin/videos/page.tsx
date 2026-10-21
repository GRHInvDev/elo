"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { useAccessControl } from "@/hooks/use-access-control"
import { cn } from "@/lib/utils"
import {
  Video,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Play,
} from "lucide-react"
import {
  normalizeYouTubeEmbedUrl,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
} from "@/lib/youtube"

type VideoItem = {
  id: string
  title: string
  youtubeUrl: string
  published: boolean
  order: number
}

type VideoForm = {
  title: string
  youtubeUrl: string
  published: boolean
  order: number
}

const emptyForm: VideoForm = {
  title: "",
  youtubeUrl: "",
  published: true,
  order: 0,
}

export default function VideosManagementPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [form, setForm] = useState<VideoForm>(emptyForm)

  const { isSudo, hasAdminAccess, isLoading: isLoadingAccess } = useAccessControl()
  const hasAccess =
    isSudo ||
    hasAdminAccess("/admin/videos") ||
    hasAdminAccess("/admin/banners") ||
    hasAdminAccess("/admin")

  const { toast } = useToast()
  const utils = api.useUtils()

  const { data: videos = [], isLoading } = api.dashboardVideo.adminList.useQuery(undefined, {
    enabled: hasAccess,
  })

  const invalidate = async () => {
    await Promise.all([
      utils.dashboardVideo.adminList.invalidate(),
      utils.dashboardVideo.list.invalidate(),
    ])
  }

  const createVideo = api.dashboardVideo.create.useMutation({
    onSuccess: async () => {
      toast({ title: "Vídeo cadastrado", description: "O vídeo foi adicionado com sucesso." })
      setIsFormOpen(false)
      await invalidate()
    },
    onError: (error) =>
      toast({ title: "Erro", description: error.message, variant: "destructive" }),
  })

  const updateVideo = api.dashboardVideo.update.useMutation({
    onSuccess: async () => {
      toast({ title: "Vídeo atualizado", description: "As alterações foram salvas." })
      setIsFormOpen(false)
      await invalidate()
    },
    onError: (error) =>
      toast({ title: "Erro", description: error.message, variant: "destructive" }),
  })

  const togglePublished = api.dashboardVideo.update.useMutation({
    onSuccess: async (video) => {
      toast({
        title: video.published ? "Vídeo ativado" : "Vídeo desativado",
        description: video.published
          ? "O vídeo voltou a ser exibido no dashboard."
          : "O vídeo foi ocultado do dashboard.",
      })
      await invalidate()
    },
    onError: (error) =>
      toast({ title: "Erro", description: error.message, variant: "destructive" }),
  })

  const deleteVideo = api.dashboardVideo.delete.useMutation({
    onSuccess: async () => {
      toast({ title: "Vídeo excluído", description: "O vídeo foi removido do sistema." })
      setIsDeleteOpen(false)
      setSelectedVideo(null)
      await invalidate()
    },
    onError: (error) =>
      toast({ title: "Erro", description: error.message, variant: "destructive" }),
  })

  const reorderVideos = api.dashboardVideo.reorder.useMutation({
    onSuccess: async () => {
      await invalidate()
    },
    onError: (error) =>
      toast({ title: "Erro ao reordenar", description: error.message, variant: "destructive" }),
  })

  const isSaving = createVideo.isPending || updateVideo.isPending

  const openCreate = () => {
    setSelectedVideo(null)
    setForm({ ...emptyForm, order: videos.length })
    setIsFormOpen(true)
  }

  const openEdit = (video: VideoItem) => {
    setSelectedVideo(video)
    setForm({
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      published: video.published,
      order: video.order,
    })
    setIsFormOpen(true)
  }

  const moveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= videos.length) return

    const currentItem = videos[index]
    const targetItem = videos[targetIndex]
    if (!currentItem || !targetItem) return

    // Swap order
    await reorderVideos.mutateAsync({
      items: [
        { id: currentItem.id, order: targetItem.order },
        { id: targetItem.id, order: currentItem.order },
      ],
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.title.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o título do vídeo.",
        variant: "destructive",
      })
      return
    }

    if (!form.youtubeUrl.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o link ou código do YouTube.",
        variant: "destructive",
      })
      return
    }

    const payload = {
      title: form.title.trim(),
      youtubeUrl: form.youtubeUrl.trim(),
      published: form.published,
      order: form.order,
    }

    if (selectedVideo) {
      updateVideo.mutate({ id: selectedVideo.id, ...payload })
    } else {
      createVideo.mutate(payload)
    }
  }

  if (!isLoadingAccess && !hasAccess) {
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <Video className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Acesso Negado</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const previewEmbedUrl = form.youtubeUrl ? normalizeYouTubeEmbedUrl(form.youtubeUrl) : ""

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gerenciar Vídeos</h2>
            <p className="text-muted-foreground">
              Vídeos do YouTube exibidos na página inicial da intranet. Cole qualquer link (watch,
              share, shorts ou embed) que o sistema normaliza automaticamente.
            </p>
          </div>
          <Button onClick={openCreate} className="self-start sm:self-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Vídeo
          </Button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <Video className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum vídeo cadastrado. Adicione um vídeo para ser exibido no dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video, idx) => {
              const videoId = extractYouTubeVideoId(video.youtubeUrl)
              const thumbUrl = getYouTubeThumbnailUrl(video.youtubeUrl)

              return (
                <Card key={video.id} className="overflow-hidden flex flex-col justify-between">
                  <div>
                    {/* Preview / Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black/90">
                      {thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbUrl}
                          alt={video.title}
                          className={cn(
                            "h-full w-full object-cover transition-transform duration-300 hover:scale-105",
                            !video.published && "opacity-40 grayscale",
                          )}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Play className="h-12 w-12 text-white/50" />
                        </div>
                      )}

                      {!video.published && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-xs">
                          <Badge variant="secondary" className="gap-1 shadow-sm">
                            <EyeOff className="h-3 w-3" />
                            Desativado
                          </Badge>
                        </div>
                      )}

                      {videoId && (
                        <a
                          href={`https://www.youtube.com/watch?v=${videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 rounded-full bg-black/70 p-1.5 text-white shadow-md hover:bg-black/90"
                          title="Abrir no YouTube"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-base">{video.title}</p>
                          <p className="truncate text-xs text-muted-foreground font-mono mt-0.5">
                            {video.youtubeUrl}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge
                            variant={video.published ? "default" : "secondary"}
                            className="gap-1"
                          >
                            {video.published ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                            {video.published ? "Ativo" : "Inativo"}
                          </Badge>
                          <Badge variant="outline">Ordem {video.order}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between border-t p-3 bg-muted/20">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === 0 || reorderVideos.isPending}
                        onClick={() => moveOrder(idx, "up")}
                        title="Subir na ordem"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === videos.length - 1 || reorderVideos.isPending}
                        onClick={() => moveOrder(idx, "down")}
                        title="Descer na ordem"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          togglePublished.mutate({
                            id: video.id,
                            published: !video.published,
                          })
                        }
                        disabled={togglePublished.isPending}
                      >
                        {video.published ? (
                          <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                        ) : (
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {video.published ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(video)}
                        title="Editar"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setSelectedVideo(video)
                          setIsDeleteOpen(true)
                        }}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVideo ? "Editar Vídeo" : "Novo Vídeo do Dashboard"}
            </DialogTitle>
            <DialogDescription>
              Insira o título e o link do vídeo do YouTube para exibição no dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Vídeo</Label>
              <Input
                id="title"
                placeholder="Ex: Institucional Cristallux"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">Link do YouTube</Label>
              <Input
                id="youtubeUrl"
                placeholder="Ex: https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Aceita qualquer formato: link normal do navegador, link de compartilhamento
                (youtu.be), Shorts ou link de embed.
              </p>
            </div>

            {/* Live Preview do Vídeo */}
            {previewEmbedUrl && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Pré-visualização:</Label>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black shadow-inner">
                  <iframe
                    src={previewEmbedUrl}
                    title={form.title || "Preview"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Ordem de exibição</Label>
                <Input
                  id="order"
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) =>
                    setForm({ ...form, order: Number.parseInt(e.target.value || "0", 10) })
                  }
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="published" className="cursor-pointer text-sm font-medium">
                    Vídeo Ativo
                  </Label>
                  <Switch
                    id="published"
                    checked={form.published}
                    onCheckedChange={(checked) => setForm({ ...form, published: checked })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedVideo ? "Salvar Alterações" : "Cadastrar Vídeo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Vídeo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o vídeo &ldquo;{selectedVideo?.title}&rdquo;? Ele não
              será mais exibido no dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteVideo.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteVideo.isPending}
              onClick={() => {
                if (selectedVideo) {
                  deleteVideo.mutate({ id: selectedVideo.id })
                }
              }}
            >
              {deleteVideo.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  )
}
