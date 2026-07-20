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
import { UPLTButton } from "@/components/ui/uplt-button"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { cn } from "@/lib/utils"
import {
  GalleryHorizontal,
  Plus,
  Edit3,
  Trash2,
  Link as LinkIcon,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react"

type BannerItem = {
  id: string
  title: string
  imageUrl: string
  imageUrlMobile: string | null
  imageUrlTotem: string | null
  linkUrl: string | null
  published: boolean
  order: number
}

type BannerForm = {
  title: string
  imageUrl: string
  imageUrlMobile: string
  imageUrlTotem: string
  linkUrl: string
  published: boolean
  order: number
}

const emptyForm: BannerForm = {
  title: "",
  imageUrl: "",
  imageUrlMobile: "",
  imageUrlTotem: "",
  linkUrl: "",
  published: true,
  order: 0,
}

/**
 * Slot de upload de imagem do banner (Desktop / Mobile / Totem). Reutilizável:
 * mostra o preview atual, o botão de upload padrão e, quando opcional e já
 * preenchido, permite remover para voltar ao fallback da imagem base.
 */
function BannerImageSlot({
  label,
  hint,
  value,
  onChange,
  onClear,
  onError,
}: {
  label: string
  hint: string
  value: string
  onChange: (url: string) => void
  onClear?: () => void
  onError: (error: Error) => void
}) {
  return (
    <div className="grid gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {onClear && value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={onClear}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remover
          </Button>
        )}
      </div>
      {value && (
        <div className="relative h-32 w-full overflow-hidden rounded-md border bg-muted">
          <OptimizedImage alt={label} src={value} fill className="object-cover" />
        </div>
      )}
      <UPLTButton onImageUrlGenerated={onChange} onUploadError={onError} />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

export default function BannersManagementPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<BannerItem | null>(null)
  const [form, setForm] = useState<BannerForm>(emptyForm)

  const { isSudo, hasAdminAccess, isLoading: isLoadingAccess } = useAccessControl()
  const hasAccess = isSudo || hasAdminAccess("/admin/banners")

  const { toast } = useToast()
  const utils = api.useUtils()

  const { data: banners = [], isLoading } = api.banner.adminList.useQuery(undefined, {
    enabled: hasAccess,
  })

  const invalidate = async () => {
    await Promise.all([
      utils.banner.adminList.invalidate(),
      utils.banner.list.invalidate(),
    ])
  }

  const createBanner = api.banner.create.useMutation({
    onSuccess: async () => {
      toast({ title: "Banner criado", description: "O banner foi criado com sucesso." })
      setIsFormOpen(false)
      await invalidate()
    },
    onError: (error) =>
      toast({ title: "Erro", description: error.message, variant: "destructive" }),
  })

  const updateBanner = api.banner.update.useMutation({
    onSuccess: async () => {
      toast({ title: "Banner atualizado", description: "As alterações foram salvas." })
      setIsFormOpen(false)
      await invalidate()
    },
    onError: (error) =>
      toast({ title: "Erro", description: error.message, variant: "destructive" }),
  })

  // Ativa/desativa a exibição no carrossel sem excluir o banner
  const togglePublished = api.banner.update.useMutation({
    onSuccess: async (banner) => {
      toast({
        title: banner.published ? "Banner publicado" : "Banner desativado",
        description: banner.published
          ? "O banner voltou a ser exibido no carrossel."
          : "O banner foi ocultado do carrossel, mas continua salvo aqui.",
      })
      await invalidate()
    },
    onError: (error) =>
      toast({ title: "Erro", description: error.message, variant: "destructive" }),
  })

  const deleteBanner = api.banner.delete.useMutation({
    onSuccess: async () => {
      toast({ title: "Banner removido", description: "O banner foi removido do carrossel." })
      setIsDeleteOpen(false)
      setSelectedBanner(null)
      await invalidate()
    },
    onError: (error) =>
      toast({ title: "Erro", description: error.message, variant: "destructive" }),
  })

  const isSaving = createBanner.isPending || updateBanner.isPending

  const onUploadError = (error: Error) =>
    toast({
      title: "Erro no upload",
      description: error.message,
      variant: "destructive",
    })

  const openCreate = () => {
    setSelectedBanner(null)
    setForm({ ...emptyForm, order: banners.length })
    setIsFormOpen(true)
  }

  const openEdit = (banner: BannerItem) => {
    setSelectedBanner(banner)
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      imageUrlMobile: banner.imageUrlMobile ?? "",
      imageUrlTotem: banner.imageUrlTotem ?? "",
      linkUrl: banner.linkUrl ?? "",
      published: banner.published,
      order: banner.order,
    })
    setIsFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.title.trim() || !form.imageUrl) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe o título e a imagem do banner.",
        variant: "destructive",
      })
      return
    }

    const payload = {
      title: form.title.trim(),
      imageUrl: form.imageUrl,
      imageUrlMobile: form.imageUrlMobile === "" ? null : form.imageUrlMobile,
      imageUrlTotem: form.imageUrlTotem === "" ? null : form.imageUrlTotem,
      linkUrl: form.linkUrl.trim() === "" ? null : form.linkUrl.trim(),
      published: form.published,
      order: form.order,
    }

    if (selectedBanner) {
      updateBanner.mutate({ id: selectedBanner.id, ...payload })
    } else {
      createBanner.mutate(payload)
    }
  }

  if (!isLoadingAccess && !hasAccess) {
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <GalleryHorizontal className="mx-auto h-12 w-12 text-muted-foreground" />
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gerenciar Banners</h2>
            <p className="text-muted-foreground">
              Banners do carrossel principal do dashboard. Adicione um link para
              tornar o banner clicável (opcional).
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Banner
          </Button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : banners.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <GalleryHorizontal className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum banner cadastrado. O carrossel ficará oculto no dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {banners.map((banner) => (
              <Card key={banner.id} className="overflow-hidden">
                <div className="relative h-40 w-full bg-muted">
                  <OptimizedImage
                    alt={banner.title}
                    src={banner.imageUrl}
                    fill
                    className={cn(
                      "object-cover",
                      !banner.published && "opacity-40 grayscale",
                    )}
                  />
                  {!banner.published && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                      <Badge variant="secondary" className="gap-1">
                        <EyeOff className="h-3 w-3" />
                        Desativado
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{banner.title}</p>
                      {banner.linkUrl ? (
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <LinkIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{banner.linkUrl}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sem link</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge
                        variant={banner.published ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {banner.published ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        {banner.published ? "Publicado" : "Desativado"}
                      </Badge>
                      <Badge variant="outline">Ordem {banner.order}</Badge>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        togglePublished.mutate({
                          id: banner.id,
                          published: !banner.published,
                        })
                      }
                      disabled={togglePublished.isPending}
                    >
                      {banner.published ? (
                        <EyeOff className="mr-2 h-4 w-4" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      {banner.published ? "Desativar" : "Publicar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(banner)}
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedBanner(banner)
                        setIsDeleteOpen(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de criação/edição */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {selectedBanner ? "Editar Banner" : "Novo Banner"}
              </DialogTitle>
              <DialogDescription>
                {selectedBanner
                  ? "Altere a imagem, o link ou as configurações do banner."
                  : "Adicione um novo banner ao carrossel do dashboard."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="banner-title">Título</Label>
                <Input
                  id="banner-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Nome do banner (usado como descrição da imagem)"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="banner-link">Link (opcional)</Label>
                <Input
                  id="banner-link"
                  value={form.linkUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://exemplo.com ou /shop"
                />
                <p className="text-xs text-muted-foreground">
                  Se preenchido, o banner vira clicável. Links externos abrem em
                  nova aba.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="banner-order">Ordem</Label>
                  <Input
                    id="banner-order"
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        order: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="banner-published">Publicado</Label>
                  <Switch
                    id="banner-published"
                    checked={form.published}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({ ...f, published: checked }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <Label>Imagens do banner</Label>
                  <p className="text-xs text-muted-foreground">
                    A imagem <strong>Desktop</strong> é obrigatória e serve de
                    base. Mobile e Totem são opcionais: se ficarem em branco, o
                    banner usa a imagem Desktop nesses contextos.
                  </p>
                </div>
                <BannerImageSlot
                  label="Desktop (obrigatória)"
                  hint="Exibida em telas maiores. Formato panorâmico (recomendado ~1920×384)."
                  value={form.imageUrl}
                  onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                  onError={onUploadError}
                />
                <BannerImageSlot
                  label="Mobile (opcional)"
                  hint="Exibida em celulares. Ideal um recorte mais quadrado/vertical."
                  value={form.imageUrlMobile}
                  onChange={(url) =>
                    setForm((f) => ({ ...f, imageUrlMobile: url }))
                  }
                  onClear={() => setForm((f) => ({ ...f, imageUrlMobile: "" }))}
                  onError={onUploadError}
                />
                <BannerImageSlot
                  label="Totem (opcional)"
                  hint="Exibida para usuários de perfil Totem (quiósque)."
                  value={form.imageUrlTotem}
                  onChange={(url) =>
                    setForm((f) => ({ ...f, imageUrlTotem: url }))
                  }
                  onClear={() => setForm((f) => ({ ...f, imageUrlTotem: "" }))}
                  onError={onUploadError}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedBanner ? "Salvar alterações" : "Criar Banner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de remoção */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover banner</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o banner{" "}
              <span className="font-semibold">{selectedBanner?.title}</span>? Essa
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedBanner) {
                  deleteBanner.mutate({ id: selectedBanner.id })
                }
              }}
              disabled={deleteBanner.isPending}
            >
              {deleteBanner.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  )
}
