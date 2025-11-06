"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, Loader2 } from "lucide-react"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import type { Product } from "@prisma/client"

// Tipo estendido para incluir stock (campo adicionado recentemente)
type ProductWithStock = Product & {
  stock?: number
}

interface ProductListTableProps {
  products: ProductWithStock[]
  onEdit: (product: ProductWithStock) => void
  onRefresh: () => void
}

export function ProductListTable({ products, onEdit, onRefresh }: ProductListTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deleteProduct = api.product.delete.useMutation({
    onSuccess: () => {
      toast.success("Produto deletado com sucesso!")
      onRefresh()
      setDeletingId(null)
    },
    onError: (error) => {
      toast.error(`Erro ao deletar produto: ${error.message}`)
      setDeletingId(null)
    },
  })

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteProduct.mutateAsync({ id })
    } catch {
      // Error já é tratado no onError
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum produto cadastrado ainda.</p>
        <p className="text-sm mt-2">Clique em &quot;Novo Produto&quot; para começar.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Imagem</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right">Estoque</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                {product.imageUrl && product.imageUrl.length > 0 ? (
                  <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                    <Image
                      src={product.imageUrl[0] ?? "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Sem imagem
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                {product.code ? (
                  <Badge variant="outline" className="font-mono text-xs">
                    {product.code}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="max-w-md">
                <p className="truncate text-sm text-muted-foreground">
                  {product.description}
                </p>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{product.enterprise}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                {(() => {
                  const stock = product.stock ?? 0
                  return (
                    <Badge variant={stock <= 0 ? "destructive" : stock <= 5 ? "secondary" : "outline"}>
                      {stock <= 0 ? "Indisponível" : `${stock} unidade${stock !== 1 ? "s" : ""}`}
                    </Badge>
                  )
                })()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar produto</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Deletar produto</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar o produto &quot;{product.name}&quot;?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(product.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Deletar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

