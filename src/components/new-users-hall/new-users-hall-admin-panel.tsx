"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"

import { api } from "@/trpc/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { boostAvatarUrl } from "@/lib/boost-avatar-url"

import {
  NewUsersHallFormDialog,
  type NewUsersHallEntryRow,
} from "@/components/new-users-hall/new-users-hall-form-dialog"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

function NewUsersHallAdminListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Carregando gestão do Hall">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
        >
          <Skeleton className="h-24 w-24 shrink-0 rounded-full sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9 shrink-0" />
            <Skeleton className="h-9 w-9 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NewUsersHallAdminPanel() {
  const { toast } = useToast()
  const utils = api.useUtils()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NewUsersHallEntryRow | null>(null)

  const { data: allList, isLoading } = api.newUsersHall.listAll.useQuery()

  const deleteMut = api.newUsersHall.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Entrada removida" })
      void utils.newUsersHall.listPublished.invalidate()
      void utils.newUsersHall.listAll.invalidate()
    },
    onError: (e) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    },
  })

  const updateEntry = api.newUsersHall.update.useMutation({
    onSuccess: () => {
      void utils.newUsersHall.listPublished.invalidate()
      void utils.newUsersHall.listAll.invalidate()
    },
    onError: (e) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    },
  })

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (row: NewUsersHallEntryRow) => {
    setEditing(row)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Remover esta entrada do Hall de entrada?")) {
      deleteMut.mutate({ id })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/forms/hall-entrada" className="gap-2">
                Ver página pública
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo colaborador
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <NewUsersHallAdminListSkeleton />
          ) : !allList?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma entrada cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {allList.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border bg-muted sm:h-28 sm:w-28">
                    {row.effectiveImageUrl ? (
                      <Image
                        src={boostAvatarUrl(row.effectiveImageUrl)}
                        alt={row.name}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 640px) 96px, 112px"
                        quality={95}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-medium sm:text-base">
                        {getInitials(row.name)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium truncate">{row.name}</p>
                      {row.isHighlight ? (
                        <Badge className="shrink-0 gap-0.5 text-[10px]" variant="default">
                          <Sparkles className="h-2.5 w-2.5" aria-hidden />
                          Destaque
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {row.setor && row.setor.trim() !== "" ? row.setor : "—"}
                      {row.userId ? (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          Vinculado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Manual
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`admin-pub-${row.id}`}
                        checked={row.published}
                        disabled={
                          updateEntry.isPending && updateEntry.variables?.id === row.id
                        }
                        onCheckedChange={(c) => {
                          updateEntry.mutate({
                            id: row.id,
                            published: c === true,
                          })
                        }}
                      />
                      <Label htmlFor={`admin-pub-${row.id}`} className="cursor-pointer text-xs">
                        Publicado
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`admin-hi-${row.id}`}
                        checked={row.isHighlight}
                        disabled={
                          updateEntry.isPending && updateEntry.variables?.id === row.id
                        }
                        onCheckedChange={(c) => {
                          updateEntry.mutate({
                            id: row.id,
                            isHighlight: c === true,
                          })
                        }}
                      />
                      <Label htmlFor={`admin-hi-${row.id}`} className="cursor-pointer text-xs">
                        Destaque
                      </Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(row.id)}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NewUsersHallFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
        entry={editing}
        onSuccess={() => {
          setEditing(null)
        }}
      />
    </div>
  )
}
