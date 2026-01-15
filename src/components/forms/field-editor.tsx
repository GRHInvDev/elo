"use client"
import type { DynamicType, Field, FormattedType } from "@/lib/form-types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PlusCircle, X } from "lucide-react"

interface FieldEditorProps {
  field: Field
  onChange: (field: Field) => void
}

export function FieldEditor({ field, onChange }: FieldEditorProps) {
  const updateField = (updates: Partial<Field>) => {
    onChange({ ...field, ...updates } as Field)
  }

  const addOption = () => {
    if (field.type === "combobox") {
      const options = [...(field.options ?? []), { label: "", value: "" }]
      updateField({ options })
    }
  }

  const updateOption = (index: number, key: "label" | "value", value: string) => {
    if (field.type === "combobox" && field.options) {
      const options = [...field.options]
      options[index] = { value: `${index + 1} - ${options[index]?.label ?? ""}`, label: options[index]?.label ?? "", [key]: value ?? "" }
      updateField({ options })
    }
  }

  const removeOption = (index: number) => {
    if (field.type === "combobox" && field.options) {
      const options = field.options.filter((_, i) => i !== index)
      updateField({ options })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Editar Campo: {field.label ?? "Sem título"}</h2>
        <p className="text-sm text-muted-foreground mb-6">Configure as propriedades do campo selecionado</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="label">Rótulo</Label>
          <Input
            id="label"
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
            placeholder="Rótulo do campo"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Nome (ID)</Label>
          <Input
            id="name"
            value={field.name}
            onChange={(e) => updateField({ name: e.target.value })}
            placeholder="nome_do_campo"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={field.placeholder ?? ""}
            onChange={(e) => updateField({ placeholder: e.target.value })}
            placeholder="Placeholder do campo"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="required"
            checked={field.required ?? false}
            onCheckedChange={(checked) => updateField({ required: checked === true })}
          />
          <Label htmlFor="required">Campo obrigatório</Label>
        </div>

        {/* Campos específicos por tipo */}
        {field.type === "text" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minLength">Tamanho mínimo</Label>
                <Input
                  id="minLength"
                  type="number"
                  min={0}
                  value={field.minLength ?? ""}
                  onChange={(e) =>
                    updateField({
                      minLength: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxLength">Tamanho máximo</Label>
                <Input
                  id="maxLength"
                  type="number"
                  min={0}
                  value={field.maxLength ?? ""}
                  onChange={(e) =>
                    updateField({
                      maxLength: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </>
        )}

        {field.type === "number" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min">Valor mínimo</Label>
                <Input
                  id="min"
                  type="number"
                  value={field.min ?? ""}
                  onChange={(e) =>
                    updateField({
                      min: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max">Valor máximo</Label>
                <Input
                  id="max"
                  type="number"
                  value={field.max ?? ""}
                  onChange={(e) =>
                    updateField({
                      max: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="step">Incremento</Label>
              <Input
                id="step"
                type="number"
                min={0}
                step={0.01}
                value={field.step ?? ""}
                onChange={(e) =>
                  updateField({
                    step: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </>
        )}

        {field.type === "formatted" && (
          <div className="grid gap-2">
            <Label htmlFor="formattedType">Tipo de formatação</Label>
            <Select
              value={field.formattedType ?? "cpf"}
              onValueChange={(value) => updateField({ formattedType: value as FormattedType })}
            >
              <SelectTrigger id="formattedType">
                <SelectValue placeholder="Selecione o tipo de formatação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {field.type === "textarea" && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="rows">Linhas</Label>
              <Input
                id="rows"
                type="number"
                min={1}
                value={field.rows ?? "3"}
                onChange={(e) =>
                  updateField({
                    rows: e.target.value ? Number.parseInt(e.target.value) : 3,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="textareaMinLength">Tamanho mínimo</Label>
                <Input
                  id="textareaMinLength"
                  type="number"
                  min={0}
                  value={field.minLength ?? ""}
                  onChange={(e) =>
                    updateField({
                      minLength: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="textareaMaxLength">Tamanho máximo</Label>
                <Input
                  id="textareaMaxLength"
                  type="number"
                  min={0}
                  value={field.maxLength ?? ""}
                  onChange={(e) =>
                    updateField({
                      maxLength: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {field.type === "combobox" && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="multiple"
                checked={field.multiple ?? false}
                onCheckedChange={(checked) => updateField({ multiple: checked === true })}
              />
              <Label htmlFor="multiple">Seleção múltipla</Label>
            </div>

            <div className="space-y-2">
              <Label>Opções</Label>
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option.label}
                      onChange={(e) => updateOption(index, "label", e.target.value)}
                      placeholder="Rótulo"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-2" onClick={addOption}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Opção
                </Button>
              </div>
            </div>
          </>
        )}

        {field.type === "file" && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="acceptedFileTypes">Tipos de arquivo aceitos</Label>
              <Input
                id="acceptedFileTypes"
                value={field.acceptedFileTypes ?? ""}
                onChange={(e) => updateField({ acceptedFileTypes: e.target.value })}
                placeholder=".pdf,.jpg,.png"
              />
              <p className="text-xs text-muted-foreground">Separe as extensões por vírgula (ex: .pdf,.jpg,.png)</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxFileSize">Tamanho máximo (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                min={0}
                step={0.1}
                value={field.maxFileSize ?? ""}
                onChange={(e) =>
                  updateField({
                    maxFileSize: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="multiple-files"
                checked={field.multipleFiles ?? false}
                onCheckedChange={(checked) => updateField({ multipleFiles: checked === true })}
              />
              <Label htmlFor="multiple-files">Permitir múltiplos arquivos</Label>
            </div>
          </>
        )}

        {field.type === "dynamic" && (
          <div className="grid gap-2">
            <Label htmlFor="dynamicType">Tipo de dado dinâmico</Label>
            <Select
              value={field.dynamicType ?? "user_name"}
              onValueChange={(value) => {
                const label = value === "user_name" ? "Nome do Usuário" : "Setor";
                updateField({ dynamicType: value as DynamicType, label });
              }}
            >
              <SelectTrigger id="dynamicType">
                <SelectValue placeholder="Selecione o tipo de dado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user_name">Nome do Usuário</SelectItem>
                <SelectItem value="user_sector">Setor do Usuário</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Este campo será preenchido automaticamente pelo sistema.</p>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="helpText">Texto de ajuda</Label>
          <Textarea
            id="helpText"
            value={field.helpText ?? ""}
            onChange={(e) => updateField({ helpText: e.target.value })}
            placeholder="Texto de ajuda para o usuário"
          />
        </div>
      </div>
    </div>
  )
}

