"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { type z } from "zod"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { type Product, Enterprise } from "@prisma/client"

import { api } from "@/trpc/react"
import { createProductSchema } from "@/schemas/product.schema"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

type ProductFormValues = z.infer<typeof createProductSchema>

export default function ProductAdmin() {
  const [open, setOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const { toast } = useToast()
  const utils = api.useUtils()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(createProductSchema),
  })

  const { data: products, isLoading } = api.product.getAll.useQuery()

  const createMutation = api.product.create.useMutation({
    onSuccess: () => {
      toast({ title: "Produto criado com sucesso" })
      setOpen(false)
      setEditingProduct(null)
      form.reset()
      void utils.product.getAll.invalidate()
    },
    onError: (error) => {
      toast({ title: "Erro ao criar produto", description: error.message, variant: "destructive" })
    },
  })

  const updateMutation = api.product.update.useMutation({
    onSuccess: () => {
      toast({ title: "Produto atualizado com sucesso" })
      setOpen(false)
      setEditingProduct(null)
      form.reset()
      void utils.product.getAll.invalidate()
    },
    onError: (error) => {
        toast({ title: "Erro ao atualizar produto", description: error.message, variant: "destructive" })
    },
  })

  const deleteMutation = api.product.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Produto removido com sucesso" })
      void utils.product.getAll.invalidate()
    },
    onError: (error) => {
      toast({ title: "Erro ao remover produto", description: error.message, variant: "destructive" })
    },
  })

  const onSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
        updateMutation.mutate({ ...data, id: editingProduct.id })
    } else {
        createMutation.mutate(data)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    form.reset({
        name: product.name,
        description: product.description,
        enterprise: product.enterprise,
        imageUrl: product.imageUrl,
        price: product.price
    })
    setOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este produto?")) {
      deleteMutation.mutate({ id })
    }
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Dialog open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen)
                if(!isOpen) {
                    setEditingProduct(null)
                    form.reset()
                }
            }}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Produto
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? "Edite os dados do produto" : "Preencha os dados para adicionar um novo produto"}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome do produto" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Descrição do produto" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preço</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="99.99" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="enterprise"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Empresa</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a empresa" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(Enterprise).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* TODO: Add image upload */}
                             <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL da Imagem</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} value={field.value?.[0] ?? ""} onChange={(e) => field.onChange([e.target.value])} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {createMutation.isPending || updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Salvar
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </TableCell>
                        </TableRow>
                    ) : products?.length ? (
                        products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.enterprise}</TableCell>
                                <TableCell>{product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} disabled={deleteMutation.isPending}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">
                                Nenhum produto encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  )
} 