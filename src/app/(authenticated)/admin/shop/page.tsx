"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { useAccessControl } from "@/hooks/use-access-control";
import { createProductSchema } from "@/schemas/product.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultipleImageUpload } from "@/components/ui/multiple-image-upload";

type FormData = z.infer<typeof createProductSchema>;

export default function AdminShopPage() {
  const router = useRouter();
  const { canManageShop, hasAdminAccess } = useAccessControl();

  const allowed = canManageShop();
  const allowedAdminShell = hasAdminAccess("/admin");

  const utils = api.useContext();
  const { data: products } = api.product.getAll.useQuery();

  const createMutation = api.product.create.useMutation({
    onSuccess: async () => {
      await utils.product.getAll.invalidate();
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      active: false,
      imageUrl: [],
      enterprise: "RHenz",
    },
  });

  const onSubmit = async (data: FormData) => {
    await createMutation.mutateAsync({
      ...data,
    });
  };


  if (!allowed || !allowedAdminShell) {
    router.replace("/admin");
    return null;
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Criar Produto</TabsTrigger>
          <TabsTrigger value="list">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Novo Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
                </div>
                <div>
                  <Label htmlFor="code">Código</Label>
                  <Input id="code" {...register("code")} aria-invalid={!!errors.code} />
                </div>
                <div>
                  <Label htmlFor="price">Preço</Label>
                  <Input id="price" type="number" step="0.01" {...register("price", { valueAsNumber: true })} aria-invalid={!!errors.price} />
                </div>
                <div>
                  <Label htmlFor="enterprise">Empresa</Label>
                  <Input id="enterprise" {...register("enterprise")} aria-invalid={!!errors.enterprise} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" rows={3} {...register("description")} aria-invalid={!!errors.description} />
                </div>
                <div className="md:col-span-2">
                  <Label>Imagens do produto</Label>
                  <MultipleImageUpload
                    onImagesChange={(urls) => setValue("imageUrl", urls, { shouldValidate: true })}
                    maxImages={10}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="active" checked={watch("active") ?? false} onCheckedChange={(v) => setValue("active", v)} />
                  <Label htmlFor="active">Ativo</Label>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Criar Produto"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2">Nome</th>
                      <th className="p-2">Código</th>
                      <th className="p-2">Empresa</th>
                      <th className="p-2">Preço</th>
                      <th className="p-2">Ativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products?.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{(p as any).code}</td>
                        <td className="p-2">{p.enterprise}</td>
                        <td className="p-2">R$ {p.price?.toFixed(2)}</td>
                        <td className="p-2">{(p as any).active ? "Sim" : "Não"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


