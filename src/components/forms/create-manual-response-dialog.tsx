"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/trpc/react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Field } from "@/lib/form-types"

interface CreateManualResponseDialogProps {
    formId: string
    formFields: Field[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function CreateManualResponseDialog({
    formId,
    formFields,
    open,
    onOpenChange,
    onSuccess,
}: CreateManualResponseDialogProps) {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [userSearchOpen, setUserSearchOpen] = useState(false)
    const [userSearchValue, setUserSearchValue] = useState("")

    // Buscar todos os usuários
    const { data: allUsers = [], isLoading: isLoadingUsers } = api.user.listAll.useQuery()

    // Criar schema dinâmico baseado nos campos do formulário
    const createSchema = () => {
        const schemaObj: Record<string, z.ZodTypeAny> = {}
        
        formFields.forEach((field) => {
            let schema: z.ZodTypeAny
            
            switch (field.type) {
                case "text":
                case "textarea":
                    let stringSchema = z.string()
                    if (field.required) {
                        stringSchema = stringSchema.min(1, `${field.label} é obrigatório`)
                    }
                    if (field.maxLength) {
                        stringSchema = stringSchema.max(field.maxLength, `Máximo de ${field.maxLength} caracteres`)
                    }
                    schema = field.required ? stringSchema : stringSchema.optional()
                    break
                case "number":
                    let numberSchema = z.number()
                    if (field.required) {
                        numberSchema = numberSchema.min(field.min ?? 0)
                    }
                    if (field.max) {
                        numberSchema = numberSchema.max(field.max)
                    }
                    schema = field.required ? numberSchema : numberSchema.optional()
                    break
                case "checkbox":
                    schema = z.boolean()
                    if (!field.required) {
                        schema = schema.optional()
                    }
                    break
                case "combobox":
                    if (field.multiple) {
                        schema = z.array(z.string())
                        if (field.required) {
                            schema = (schema as z.ZodArray<z.ZodString>).min(1, "Selecione pelo menos uma opção")
                        } else {
                            schema = schema.optional()
                        }
                    } else {
                        schema = z.string()
                        if (field.required) {
                            schema = (schema as z.ZodString).min(1, "Selecione uma opção")
                        } else {
                            schema = schema.optional()
                        }
                    }
                    break
                default:
                    schema = z.any().optional()
            }
            
            schemaObj[field.name] = schema
        })
        
        return z.object(schemaObj)
    }

    const formSchema = createSchema()
    type FormData = z.infer<typeof formSchema>

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    })

    const createManualResponse = api.formResponse.createManual.useMutation({
        onSuccess: () => {
            toast.success("Chamado criado com sucesso!")
            reset()
            setSelectedUserId(null)
            onOpenChange(false)
            onSuccess?.()
        },
        onError: (error) => {
            toast.error(`Erro ao criar chamado: ${error.message}`)
        },
    })

    const onSubmit = async (data: FormData) => {
        if (!selectedUserId) {
            toast.error("Selecione um usuário")
            return
        }

        // Converter dados do formulário para o formato esperado
        const responses = [data as Record<string, unknown>]

        await createManualResponse.mutateAsync({
            formId,
            userId: selectedUserId,
            responses,
        })
    }

    // Filtrar usuários baseado na busca
    const filteredUsers = allUsers.filter((user) => {
        if (!userSearchValue.trim()) return true
        const search = userSearchValue.toLowerCase()
        const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim().toLowerCase()
        return (
            fullName.includes(search) ||
            user.email.toLowerCase().includes(search) ||
            (user.setor?.toLowerCase().includes(search))
        )
    })

    const selectedUser = allUsers.find((u) => u.id === selectedUserId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Criar Chamado Manual
                    </DialogTitle>
                    <DialogDescription>
                        Crie um chamado vinculado a um usuário específico. Preencha os campos do formulário.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Seleção de usuário */}
                    <div className="space-y-2">
                        <Label htmlFor="user">Usuário *</Label>
                        <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={userSearchOpen}
                                    className="w-full justify-between"
                                    disabled={isLoadingUsers}
                                >
                                    {selectedUser
                                        ? `${selectedUser.firstName ?? ""} ${selectedUser.lastName ?? ""}`.trim() || selectedUser.email
                                        : "Selecione um usuário..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                    <CommandInput
                                        placeholder="Buscar usuário por nome, email ou setor..."
                                        value={userSearchValue}
                                        onValueChange={setUserSearchValue}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            {isLoadingUsers ? "Carregando..." : "Nenhum usuário encontrado."}
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {filteredUsers.map((user) => (
                                                <CommandItem
                                                    key={user.id}
                                                    value={user.id}
                                                    onSelect={() => {
                                                        setSelectedUserId(user.id)
                                                        setUserSearchOpen(false)
                                                        setUserSearchValue("")
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {user.firstName || user.lastName
                                                                ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                                                                : user.email}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {user.email} {user.setor && `• ${user.setor}`}
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {!selectedUserId && (
                            <p className="text-sm text-destructive">Selecione um usuário para criar o chamado</p>
                        )}
                    </div>

                    {/* Campos do formulário */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Preencha os campos do formulário:</h3>
                        {formFields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <Label htmlFor={field.name}>
                                    {field.label}
                                    {field.required && <span className="text-destructive ml-1">*</span>}
                                </Label>

                                {field.type === "text" && (
                                    <Input
                                        id={field.name}
                                        {...register(field.name)}
                                        placeholder={field.placeholder}
                                        maxLength={field.maxLength}
                                        aria-invalid={!!errors[field.name]}
                                    />
                                )}

                                {field.type === "textarea" && (
                                    <Textarea
                                        id={field.name}
                                        {...register(field.name)}
                                        placeholder={field.placeholder}
                                        rows={field.rows ?? 3}
                                        maxLength={field.maxLength}
                                        aria-invalid={!!errors[field.name]}
                                    />
                                )}

                                {field.type === "number" && (
                                    <Input
                                        id={field.name}
                                        type="number"
                                        {...register(field.name, { valueAsNumber: true })}
                                        placeholder={field.placeholder}
                                        min={field.min}
                                        max={field.max}
                                        step={field.step}
                                        aria-invalid={!!errors[field.name]}
                                    />
                                )}

                                {field.type === "checkbox" && (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={field.name}
                                            onCheckedChange={(checked) => {
                                                setValue(field.name, checked as boolean)
                                            }}
                                        />
                                        <label
                                            htmlFor={field.name}
                                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {field.placeholder ?? "Sim"}
                                        </label>
                                    </div>
                                )}

                                {field.type === "combobox" && (
                                    <Select
                                        onValueChange={(value) => {
                                            if (field.multiple) {
                                                const current = watch(field.name) as string[] | undefined
                                                const newValue = current?.includes(value)
                                                    ? current.filter((v) => v !== value)
                                                    : [...(current ?? []), value]
                                                setValue(field.name, newValue)
                                            } else {
                                                setValue(field.name, value)
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={field.placeholder ?? "Selecione..."} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options?.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {errors[field.name] && (
                                    <p className="text-sm text-destructive">
                                        {errors[field.name]?.message as string}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false)
                                reset()
                                setSelectedUserId(null)
                            }}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !selectedUserId}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                "Criar Chamado"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

