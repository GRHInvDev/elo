"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type z } from "zod";
import { Enterprise } from "@prisma/client";
import { api } from "@/trpc/react";
import { upsertEnterpriseConfigSchema } from "@/schemas/enterpriseConfig.schema";
import { Button } from "./ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Loader2 } from "lucide-react";

type EnterpriseEmailFormValues = z.infer<typeof upsertEnterpriseConfigSchema>;

function EnterpriseEmailForm({
    enterprise,
    initialEmail,
}: {
    enterprise: Enterprise;
    initialEmail: string;
}) {
    const { toast } = useToast();
    const utils = api.useUtils();

    const mutation = api.enterpriseConfig.upsert.useMutation({
        onSuccess: () => {
            toast({ title: "Email salvo com sucesso!" });
            void utils.enterpriseConfig.getAll.invalidate();
        },
        onError: (error) => {
            toast({ title: "Erro ao salvar email", description: error.message, variant: "destructive" });
        },
    });

    const form = useForm<EnterpriseEmailFormValues>({
        resolver: zodResolver(upsertEnterpriseConfigSchema),
        defaultValues: {
            enterprise: enterprise,
            shopNotificationEmail: initialEmail,
        },
    });

    const onSubmit = (data: EnterpriseEmailFormValues) => {
        mutation.mutate(data);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{enterprise}</CardTitle>
                <CardDescription>
                    Email para notificações da loja para a empresa {enterprise}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="shopNotificationEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="email@exemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export function EnterpriseEmailAdmin() {
    const { data: configs, isLoading } = api.enterpriseConfig.getAll.useQuery();

    if (isLoading) {
        return <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div>
            <h2 className="text-lg font-semibold">Emails da Loja por Empresa</h2>
            <p className="text-sm text-muted-foreground">Configure os emails que receberão as notificações de compra da loja.</p>
            <div className="grid gap-4 mt-4 md:grid-cols-2">
                {Object.values(Enterprise).map(enterprise => (
                    <EnterpriseEmailForm
                        key={enterprise}
                        enterprise={enterprise}
                        initialEmail={configs?.find(c => c.enterprise === enterprise)?.shopNotificationEmail ?? ""}
                    />
                ))}
            </div>
        </div>
    )
} 