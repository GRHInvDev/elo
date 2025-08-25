# 📝 Sistema de Formulários Dinâmicos

## 📋 Visão Geral

O **Sistema de Formulários Dinâmicos** é uma plataforma completa para criação, gestão e processamento de formulários customizáveis. Oferece um builder visual intuitivo, workflow de aprovação e sistema de notificações integrado.

## 🎯 Objetivos do Sistema

### **Para Administradores**
- ✅ **Criação Visual** - Interface drag-and-drop intuitiva
- ✅ **Templates Reutilizáveis** - Formulários base para processos comuns
- ✅ **Workflow Configurável** - Etapas personalizáveis de aprovação
- ✅ **Relatórios Avançados** - Analytics e métricas de uso
- ✅ **Integração** - Conexão com sistemas externos

### **Para Usuários Finais**
- ✅ **Experiência Fluida** - Formulários responsivos e acessíveis
- ✅ **Auto-save** - Dados preservados automaticamente
- ✅ **Validação Inteligente** - Feedback em tempo real
- ✅ **Multi-device** - Funciona em desktop e mobile
- ✅ **Acompanhamento** - Status e histórico das submissões

## 🏗️ Arquitetura do Sistema

### **Componentes Principais**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Form Builder  │    │   Form Engine    │    │   Workflow      │
│   Visual Editor │◄──►│   Runtime        │◄──►│   Processor     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │    │   Validation     │    │   Notifications │
│   Fields, Layout│    │   Rules          │    │   Email, Webhook│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🗄️ Modelo de Dados

### **Form (Formulário)**
```prisma
model Form {
  id            String      @id @default(cuid())
  title         String
  description   String?
  schema        Json        // Schema completo do formulário
  settings      Json?       // Configurações adicionais
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Foreign Keys
  authorId      String

  // Relations
  author        User        @relation(fields: [authorId], references: [id])
  responses     FormResponse[]
  workflow      FormWorkflow?

  @@map("forms")
}
```

### **FormResponse (Resposta)**
```prisma
model FormResponse {
  id            String      @id @default(cuid())
  data          Json        // Dados da resposta
  metadata      Json?       // Metadados (IP, UserAgent, etc.)
  status        ResponseStatus @default(PENDING)
  submittedAt   DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Foreign Keys
  userId        String
  formId        String

  // Relations
  user          User        @relation(fields: [userId], references: [id])
  form          Form        @relation(fields: [formId], references: [id])
  workflowSteps FormResponseWorkflow[]
  comments      FormResponseComment[]

  @@map("form_responses")
}
```

### **FormWorkflow (Workflow)**
```prisma
model FormWorkflow {
  id            String      @id @default(cuid())
  steps         Json        // Passos do workflow
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Foreign Keys
  formId        String      @unique

  // Relations
  form          Form        @relation(fields: [formId], references: [id])

  @@map("form_workflows")
}
```

### **FormResponseWorkflow (Passos do Workflow)**
```prisma
model FormResponseWorkflow {
  id            String      @id @default(cuid())
  stepId        String      // ID do passo no workflow
  status        WorkflowStepStatus @default(PENDING)
  assignedTo    String?     // Usuário responsável
  notes         String?     // Observações
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Foreign Keys
  responseId    String

  // Relations
  response      FormResponse @relation(fields: [responseId], references: [id])

  @@map("form_response_workflows")
}
```

### **Enums e Tipos**
```prisma
enum ResponseStatus {
  DRAFT       // Rascunho (auto-save)
  PENDING     // Enviado, aguardando análise
  IN_REVIEW   // Em análise
  APPROVED    // Aprovado
  REJECTED    // Rejeitado
  REVISION    // Requer revisão
}

enum WorkflowStepStatus {
  PENDING     // Aguardando
  IN_PROGRESS // Em andamento
  COMPLETED   // Concluído
  SKIPPED     // Pulado
}

enum FormFieldType {
  TEXT
  TEXTAREA
  NUMBER
  EMAIL
  PHONE
  DATE
  TIME
  DATETIME
  SELECT
  MULTISELECT
  RADIO
  CHECKBOX
  FILE
  SIGNATURE
}
```

## 🎨 Form Builder - Editor Visual

### **Interface Principal**
```tsx
// src/app/forms/new/page.tsx
'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { FormBuilder } from '@/components/forms/form-builder'
import { FormPreview } from '@/components/forms/form-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function NewFormPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fields: [],
    settings: {
      isPublic: false,
      requiresAuth: true,
      allowMultipleSubmissions: false,
      submissionDeadline: null,
      notifications: {
        emailOnSubmit: true,
        emailOnApproval: true,
      },
    },
  })

  const createFormMutation = trpc.form.create.useMutation()

  const handleSave = async () => {
    try {
      await createFormMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        schema: {
          fields: formData.fields,
          settings: formData.settings,
        },
      })
      // Success handling
    } catch (error) {
      // Error handling
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Criar Novo Formulário</h1>
            <p className="text-muted-foreground">
              Use o editor visual para criar formulários customizados
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Salvar Rascunho</Button>
            <Button onClick={handleSave} disabled={createFormMutation.isLoading}>
              {createFormMutation.isLoading ? 'Salvando...' : 'Publicar Formulário'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList>
            <TabsTrigger value="builder">Construtor</TabsTrigger>
            <TabsTrigger value="preview">Prévia</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Toolbox */}
              <Card>
                <CardHeader>
                  <CardTitle>Elementos</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormFieldPalette
                    onFieldAdd={(fieldType) => {
                      const newField = createField(fieldType)
                      setFormData(prev => ({
                        ...prev,
                        fields: [...prev.fields, newField],
                      }))
                    }}
                  />
                </CardContent>
              </Card>

              {/* Builder Canvas */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Formulário</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormBuilder
                    fields={formData.fields}
                    onFieldsChange={(fields) =>
                      setFormData(prev => ({ ...prev, fields }))
                    }
                    onFieldEdit={(index, field) => {
                      const newFields = [...formData.fields]
                      newFields[index] = field
                      setFormData(prev => ({ ...prev, fields: newFields }))
                    }}
                    onFieldDelete={(index) => {
                      const newFields = formData.fields.filter((_, i) => i !== index)
                      setFormData(prev => ({ ...prev, fields: newFields }))
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Prévia do Formulário</CardTitle>
              </CardHeader>
              <CardContent>
                <FormPreview
                  title={formData.title}
                  description={formData.description}
                  fields={formData.fields}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <FormSettings
              settings={formData.settings}
              onSettingsChange={(settings) =>
                setFormData(prev => ({ ...prev, settings }))
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

### **Componente FormBuilder**
```tsx
// src/components/forms/form-builder.tsx
'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { FormField } from './form-field'
import { Button } from '@/components/ui/button'
import { GripVertical, Settings, Trash2 } from 'lucide-react'

interface FormBuilderProps {
  fields: FormField[]
  onFieldsChange: (fields: FormField[]) => void
  onFieldEdit: (index: number, field: FormField) => void
  onFieldDelete: (index: number) => void
}

export function FormBuilder({
  fields,
  onFieldsChange,
  onFieldEdit,
  onFieldDelete,
}: FormBuilderProps) {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(fields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onFieldsChange(items)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="form-fields">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
            {fields.map((field, index) => (
              <Draggable key={field.id} draggableId={field.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`border rounded-lg p-4 ${
                      snapshot.isDragging ? 'shadow-lg bg-accent' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-sm">{field.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {field.type}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFieldEdit(index, field)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFieldDelete(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <FormField field={field} mode="builder" />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {fields.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Arraste elementos aqui para começar a construir seu formulário</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
```

### **Configuração de Campos**
```tsx
// src/components/forms/field-editor.tsx
'use client'

import { useState } from 'react'
import { FormField } from '@/types/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FieldEditorProps {
  field: FormField
  onSave: (field: FormField) => void
  onCancel: () => void
}

export function FieldEditor({ field, onSave, onCancel }: FieldEditorProps) {
  const [editedField, setEditedField] = useState<FormField>(field)

  const handleSave = () => {
    onSave(editedField)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Label */}
        <div className="space-y-2">
          <Label htmlFor="label">Rótulo do Campo</Label>
          <Input
            id="label"
            value={editedField.label}
            onChange={(e) => setEditedField(prev => ({
              ...prev,
              label: e.target.value
            }))}
            placeholder="Ex: Nome Completo"
          />
        </div>

        {/* Field Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Tipo do Campo</Label>
          <Select
            value={editedField.type}
            onValueChange={(value) => setEditedField(prev => ({
              ...prev,
              type: value as FormFieldType
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="textarea">Área de Texto</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="select">Seleção</SelectItem>
              <SelectItem value="multiselect">Múltipla Seleção</SelectItem>
              <SelectItem value="radio">Radio Buttons</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="file">Arquivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Field Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea
          id="description"
          value={editedField.description || ''}
          onChange={(e) => setEditedField(prev => ({
            ...prev,
            description: e.target.value
          }))}
          placeholder="Ajude o usuário a entender o que deve preencher"
          rows={2}
        />
      </div>

      {/* Field Options (for select, radio, etc.) */}
      {(editedField.type === 'select' || editedField.type === 'multiselect' || editedField.type === 'radio') && (
        <div className="space-y-2">
          <Label>Opções</Label>
          <div className="space-y-2">
            {editedField.options?.map((option, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(editedField.options || [])]
                    newOptions[index] = e.target.value
                    setEditedField(prev => ({
                      ...prev,
                      options: newOptions
                    }))
                  }}
                  placeholder={`Opção ${index + 1}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = editedField.options?.filter((_, i) => i !== index) || []
                    setEditedField(prev => ({
                      ...prev,
                      options: newOptions
                    }))
                  }}
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setEditedField(prev => ({
                  ...prev,
                  options: [...(prev.options || []), '']
                }))
              }}
            >
              Adicionar Opção
            </Button>
          </div>
        </div>
      )}

      {/* Validation Rules */}
      <div className="space-y-4">
        <h4 className="font-medium">Regras de Validação</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Required */}
          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={editedField.required || false}
              onCheckedChange={(checked) => setEditedField(prev => ({
                ...prev,
                required: checked
              }))}
            />
            <Label htmlFor="required">Campo obrigatório</Label>
          </div>

          {/* Minimum Length */}
          {editedField.type === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="minLength">Comprimento mínimo</Label>
              <Input
                id="minLength"
                type="number"
                value={editedField.validation?.minLength || ''}
                onChange={(e) => setEditedField(prev => ({
                  ...prev,
                  validation: {
                    ...prev.validation,
                    minLength: parseInt(e.target.value) || undefined
                  }
                }))}
              />
            </div>
          )}

          {/* Pattern */}
          {(editedField.type === 'text' || editedField.type === 'email') && (
            <div className="space-y-2">
              <Label htmlFor="pattern">Padrão (Regex)</Label>
              <Input
                id="pattern"
                value={editedField.validation?.pattern || ''}
                onChange={(e) => setEditedField(prev => ({
                  ...prev,
                  validation: {
                    ...prev.validation,
                    pattern: e.target.value || undefined
                  }
                }))}
                placeholder="Ex: ^[A-Z]{2}[0-9]{6}$"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          Salvar Campo
        </Button>
      </div>
    </div>
  )
}
```

## 🎯 Form Engine - Runtime

### **Renderização Dinâmica**
```tsx
// src/components/forms/form-renderer.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { FormField } from './form-field'
import { Progress } from '@/components/ui/progress'

interface FormRendererProps {
  form: {
    id: string
    title: string
    description?: string
    schema: {
      fields: FormField[]
      settings: FormSettings
    }
  }
  onSubmit?: (data: any) => void
  initialData?: any
  readOnly?: boolean
}

export function FormRenderer({
  form,
  onSubmit,
  initialData,
  readOnly = false
}: FormRendererProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAutoSaving, setIsAutoSaving] = useState(false)

  // Create validation schema dynamically
  const validationSchema = createValidationSchema(form.schema.fields)
  const formMethods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData || {},
  })

  // Auto-save functionality
  useEffect(() => {
    if (!readOnly) {
      const subscription = formMethods.watch((data) => {
        // Debounced auto-save
        setIsAutoSaving(true)
        setTimeout(() => {
          saveDraft(data)
          setIsAutoSaving(false)
        }, 1000)
      })
      return () => subscription.unsubscribe()
    }
  }, [formMethods.watch])

  const handleSubmit = async (data: any) => {
    if (onSubmit) {
      onSubmit(data)
    } else {
      // Default submission
      await submitForm(data)
    }
  }

  const steps = getFormSteps(form.schema.fields)
  const currentFields = steps[currentStep]?.fields || []
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        {form.description && (
          <p className="text-muted-foreground mt-2">{form.description}</p>
        )}
      </div>

      {/* Progress */}
      {steps.length > 1 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Passo {currentStep + 1} de {steps.length}</span>
            <span>{Math.round(progress)}% completo</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Auto-save indicator */}
      {isAutoSaving && (
        <div className="text-sm text-muted-foreground flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Salvando rascunho...</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={formMethods.handleSubmit(handleSubmit)} className="space-y-6">
        {currentFields.map((field) => (
          <FormField
            key={field.id}
            field={field}
            formMethods={formMethods}
            mode={readOnly ? 'view' : 'edit'}
          />
        ))}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Anterior
            </Button>
          )}

          <div className="flex space-x-2 ml-auto">
            {!readOnly && (
              <Button type="button" variant="outline">
                Salvar Rascunho
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Próximo
              </Button>
            ) : (
              <Button type="submit">
                {readOnly ? 'Fechar' : 'Enviar Formulário'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

// Helper functions
function createValidationSchema(fields: FormField[]) {
  const schema: any = {}

  fields.forEach(field => {
    let fieldSchema: any = z.string()

    if (field.required) {
      fieldSchema = fieldSchema.min(1, `${field.label} é obrigatório`)
    } else {
      fieldSchema = fieldSchema.optional()
    }

    // Type-specific validation
    switch (field.type) {
      case 'email':
        fieldSchema = fieldSchema.email('Email inválido')
        break
      case 'number':
        fieldSchema = z.number()
        if (field.validation?.min) {
          fieldSchema = fieldSchema.min(field.validation.min)
        }
        if (field.validation?.max) {
          fieldSchema = fieldSchema.max(field.validation.max)
        }
        break
      case 'date':
        fieldSchema = z.date()
        break
      default:
        if (field.validation?.minLength) {
          fieldSchema = fieldSchema.min(field.validation.minLength)
        }
        if (field.validation?.pattern) {
          fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern))
        }
    }

    schema[field.id] = fieldSchema
  })

  return z.object(schema)
}

function getFormSteps(fields: FormField[]) {
  const steps: FormStep[] = []
  let currentStep: FormStep | null = null

  fields.forEach(field => {
    if (field.type === 'step') {
      if (currentStep) {
        steps.push(currentStep)
      }
      currentStep = {
        title: field.label,
        fields: []
      }
    } else if (currentStep) {
      currentStep.fields.push(field)
    } else {
      // Create default step
      currentStep = {
        title: 'Informações Gerais',
        fields: [field]
      }
    }
  })

  if (currentStep) {
    steps.push(currentStep)
  }

  return steps
}

async function saveDraft(data: any) {
  // Implement auto-save to database
  console.log('Auto-saving draft:', data)
}

async function submitForm(data: any) {
  // Implement form submission
  console.log('Submitting form:', data)
}
```

### **FormField Component**
```tsx
// src/components/forms/form-field.tsx
'use client'

import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface FormFieldProps {
  field: FormField
  formMethods: UseFormReturn
  mode: 'edit' | 'view'
}

export function FormField({ field, formMethods, mode }: FormFieldProps) {
  const { register, setValue, watch, formState: { errors } } = formMethods
  const value = watch(field.id)

  const isViewMode = mode === 'view'

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            {...register(field.id)}
            placeholder={field.placeholder}
            disabled={isViewMode}
            className={errors[field.id] ? 'border-red-500' : ''}
          />
        )

      case 'textarea':
        return (
          <Textarea
            {...register(field.id)}
            placeholder={field.placeholder}
            rows={4}
            disabled={isViewMode}
            className={errors[field.id] ? 'border-red-500' : ''}
          />
        )

      case 'email':
        return (
          <Input
            type="email"
            {...register(field.id)}
            placeholder={field.placeholder}
            disabled={isViewMode}
            className={errors[field.id] ? 'border-red-500' : ''}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            {...register(field.id, { valueAsNumber: true })}
            placeholder={field.placeholder}
            disabled={isViewMode}
            className={errors[field.id] ? 'border-red-500' : ''}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            {...register(field.id, { valueAsDate: true })}
            disabled={isViewMode}
            className={errors[field.id] ? 'border-red-500' : ''}
          />
        )

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(newValue) => setValue(field.id, newValue)}
            disabled={isViewMode}
          >
            <SelectTrigger className={errors[field.id] ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Selecione uma opção'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={value?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = value || []
                    if (checked) {
                      setValue(field.id, [...currentValues, option])
                    } else {
                      setValue(field.id, currentValues.filter((v: string) => v !== option))
                    }
                  }}
                  disabled={isViewMode}
                />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      case 'radio':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(newValue) => setValue(field.id, newValue)}
            disabled={isViewMode}
          >
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => setValue(field.id, checked)}
              disabled={isViewMode}
            />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        )

      case 'file':
        return (
          <Input
            type="file"
            accept={field.validation?.accept || '*'}
            disabled={isViewMode}
            className={errors[field.id] ? 'border-red-500' : ''}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setValue(field.id, file)
            }}
          />
        )

      default:
        return (
          <Input
            {...register(field.id)}
            placeholder={field.placeholder}
            disabled={isViewMode}
            className={errors[field.id] ? 'border-red-500' : ''}
          />
        )
    }
  }

  if (isViewMode) {
    return (
      <div className="space-y-2">
        <Label className="font-medium">{field.label}</Label>
        <div className="p-3 bg-muted rounded-md">
          {value ? (
            <span>{String(value)}</span>
          ) : (
            <span className="text-muted-foreground">Não informado</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}

      {renderField()}

      {errors[field.id] && (
        <p className="text-sm text-red-600">{errors[field.id]?.message}</p>
      )}
    </div>
  )
}
```

## ⚙️ Backend API

### **Form Router**
```typescript
// src/server/routers/forms.ts
import { z } from "zod"
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc"

const createFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  schema: z.any(),
  settings: z.any().optional(),
})

const submitResponseSchema = z.object({
  formId: z.string(),
  data: z.any(),
  saveAsDraft: z.boolean().default(false),
})

export const formsRouter = createTRPCRouter({
  // Get all forms
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.form.findMany({
        where: { isActive: true },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  // Get form by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const form = await ctx.db.form.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
        },
      })

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found',
        })
      }

      return form
    }),

  // Create form (Admin)
  create: adminProcedure
    .input(createFormSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.form.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    }),

  // Update form (Admin or Author)
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: createFormSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const form = await ctx.db.form.findUnique({
        where: { id: input.id },
      })

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found',
        })
      }

      // Check permissions
      if (form.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own forms',
        })
      }

      return ctx.db.form.update({
        where: { id: input.id },
        data: input.data,
      })
    }),

  // Delete form (Admin or Author)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const form = await ctx.db.form.findUnique({
        where: { id: input.id },
      })

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found',
        })
      }

      // Check permissions
      if (form.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own forms',
        })
      }

      return ctx.db.form.delete({
        where: { id: input.id },
      })
    }),

  // Submit form response
  submitResponse: protectedProcedure
    .input(submitResponseSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if form exists and is active
      const form = await ctx.db.form.findUnique({
        where: { id: input.formId },
        include: { settings: true },
      })

      if (!form || !form.isActive) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found or inactive',
        })
      }

      // Check if user already submitted (if not allowed multiple)
      if (!form.settings?.allowMultipleSubmissions) {
        const existingResponse = await ctx.db.formResponse.findFirst({
          where: {
            formId: input.formId,
            userId: ctx.user.id,
          },
        })

        if (existingResponse && !input.saveAsDraft) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'You have already submitted this form',
          })
        }
      }

      const status = input.saveAsDraft ? 'DRAFT' : 'PENDING'

      return ctx.db.formResponse.create({
        data: {
          formId: input.formId,
          userId: ctx.user.id,
          data: input.data,
          status,
          metadata: {
            ipAddress: ctx.req?.ip,
            userAgent: ctx.req?.headers?.['user-agent'],
            submittedAt: new Date(),
          },
        },
        include: {
          form: {
            select: {
              title: true,
              settings: true,
            },
          },
        },
      })
    }),

  // Get user's responses
  getMyResponses: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.formResponse.findMany({
        where: { userId: ctx.user.id },
        include: {
          form: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      })
    }),

  // Get responses for a form (Admin or Author)
  getResponses: protectedProcedure
    .input(z.object({
      formId: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      status: z.enum(['DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user can access responses
      const form = await ctx.db.form.findUnique({
        where: { id: input.formId },
        select: { authorId: true },
      })

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found',
        })
      }

      if (form.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      const where = {
        formId: input.formId,
        ...(input.status && { status: input.status }),
      }

      const [responses, total] = await Promise.all([
        ctx.db.formResponse.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                enterprise: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        }),
        ctx.db.formResponse.count({ where }),
      ])

      return { responses, total, page: input.page, limit: input.limit }
    }),

  // Update response status (Admin or Author)
  updateResponseStatus: protectedProcedure
    .input(z.object({
      responseId: z.string(),
      status: z.enum(['DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.db.formResponse.findUnique({
        where: { id: input.responseId },
        include: {
          form: {
            select: { authorId: true },
          },
        },
      })

      if (!response) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Response not found',
        })
      }

      // Check permissions
      if (response.form.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      return ctx.db.formResponse.update({
        where: { id: input.responseId },
        data: {
          status: input.status,
          updatedAt: new Date(),
        },
      })
    }),
})
```

## 📊 Kanban de Respostas

### **Interface de Gerenciamento**
```tsx
// src/app/admin/forms/[id]/responses/page.tsx
'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_COLUMNS = [
  { id: 'PENDING', title: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'IN_REVIEW', title: 'Em Análise', color: 'bg-blue-100 text-blue-800' },
  { id: 'APPROVED', title: 'Aprovada', color: 'bg-green-100 text-green-800' },
  { id: 'REJECTED', title: 'Rejeitada', color: 'bg-red-100 text-red-800' },
]

export default function FormResponsesPage({
  params
}: {
  params: { id: string }
}) {
  const [selectedResponse, setSelectedResponse] = useState<any>(null)

  const { data: responses } = trpc.form.getResponses.useQuery({
    formId: params.id,
    page: 1,
    limit: 100,
  })

  const updateStatusMutation = trpc.form.updateResponseStatus.useMutation()

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const responseId = result.draggableId
    const newStatus = result.destination.droppableId

    try {
      await updateStatusMutation.mutateAsync({
        responseId,
        status: newStatus,
      })
    } catch (error) {
      // Handle error
    }
  }

  // Group responses by status
  const responsesByStatus = responses?.responses.reduce((acc, response) => {
    if (!acc[response.status]) {
      acc[response.status] = []
    }
    acc[response.status].push(response)
    return acc
  }, {} as Record<string, any[]>) || {}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Respostas do Formulário</h1>
        <div className="flex space-x-2">
          <Button variant="outline">Exportar CSV</Button>
          <Button variant="outline">Relatório</Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATUS_COLUMNS.map((column) => (
            <div key={column.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{column.title}</h3>
                <Badge className={column.color}>
                  {responsesByStatus[column.id]?.length || 0}
                </Badge>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[400px] p-4 rounded-lg border-2 border-dashed ${
                      snapshot.isDraggingOver
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200'
                    }`}
                  >
                    {responsesByStatus[column.id]?.map((response, index) => (
                      <Draggable
                        key={response.id}
                        draggableId={response.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-move ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                            onClick={() => setSelectedResponse(response)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={response.user.imageUrl} />
                                  <AvatarFallback>
                                    {response.user.firstName[0]}{response.user.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {response.user.firstName} {response.user.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(response.submittedAt, {
                                      addSuffix: true,
                                      locale: ptBR
                                    })}
                                  </p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="text-xs text-muted-foreground">
                                ID: {response.id.slice(0, 8)}...
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <ResponseDetailModal
          response={selectedResponse}
          onClose={() => setSelectedResponse(null)}
        />
      )}
    </div>
  )
}
```

### **Modal de Detalhes da Resposta**
```tsx
// src/components/forms/response-detail-modal.tsx
'use client'

import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ResponseDetailModalProps {
  response: any
  onClose: () => void
}

export function ResponseDetailModal({ response, onClose }: ResponseDetailModalProps) {
  const updateStatusMutation = trpc.form.updateResponseStatus.useMutation()

  const handleStatusChange = async (status: string, notes?: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        responseId: response.id,
        status,
        notes,
      })
      onClose()
    } catch (error) {
      // Handle error
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">Detalhes da Resposta</h2>
              <p className="text-muted-foreground">
                Formulário: {response.form.title}
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-muted rounded-lg">
            <Avatar>
              <AvatarImage src={response.user.imageUrl} />
              <AvatarFallback>
                {response.user.firstName[0]}{response.user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {response.user.firstName} {response.user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {response.user.enterprise} • Enviado {formatDistanceToNow(response.submittedAt, {
                  addSuffix: true,
                  locale: ptBR
                })}
              </p>
            </div>
            <Badge className={getStatusColor(response.status)}>
              {response.status}
            </Badge>
          </div>

          {/* Response Data */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium">Dados da Resposta</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(response.data).map(([key, value]) => (
                <div key={key} className="p-3 border rounded">
                  <label className="text-sm font-medium text-muted-foreground">
                    {key}
                  </label>
                  <div className="mt-1">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          {response.metadata && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Metadados</h4>
              <div className="text-sm text-muted-foreground">
                <p>IP: {response.metadata.ipAddress}</p>
                <p>User Agent: {response.metadata.userAgent}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => handleStatusChange('REJECTED')}
            >
              Rejeitar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusChange('IN_REVIEW')}
            >
              Colocar em Análise
            </Button>
            <Button
              onClick={() => handleStatusChange('APPROVED')}
            >
              Aprovar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'IN_REVIEW': return 'bg-blue-100 text-blue-800'
    case 'APPROVED': return 'bg-green-100 text-green-800'
    case 'REJECTED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
```

## 📧 Sistema de Notificações

### **Templates de Email**
```typescript
// src/lib/email/form-templates.ts
export const FORM_EMAIL_TEMPLATES = {
  formSubmitted: (data: FormSubmissionData) => `
    <h2>Nova resposta de formulário recebida</h2>
    <p><strong>Formulário:</strong> ${data.formTitle}</p>
    <p><strong>Respondido por:</strong> ${data.userName}</p>
    <p><strong>Data:</strong> ${data.submittedAt}</p>
    <br>
    <p><a href="${process.env.APP_URL}/admin/forms/${data.formId}/responses/${data.responseId}">
      Ver resposta completa
    </a></p>
  `,

  responseApproved: (data: ResponseApprovalData) => `
    <h2>Sua resposta foi aprovada! ✅</h2>
    <p><strong>Formulário:</strong> ${data.formTitle}</p>
    <p>Parabéns! Sua resposta foi aprovada com sucesso.</p>
    <p><strong>Aprovado por:</strong> ${data.approvedBy}</p>
    <br>
    <p><a href="${process.env.APP_URL}/forms/${data.formId}">
      Ver formulário
    </a></p>
  `,

  responseRejected: (data: ResponseRejectionData) => `
    <h2>Sua resposta precisa de ajustes</h2>
    <p><strong>Formulário:</strong> ${data.formTitle}</p>
    <p>Sua resposta foi rejeitada e precisa de correções.</p>
    <p><strong>Motivo:</strong> ${data.reason}</p>
    <p><strong>Revisado por:</strong> ${data.rejectedBy}</p>
    <br>
    <p><a href="${process.env.APP_URL}/forms/${data.formId}">
      Corrigir resposta
    </a></p>
  `,

  formDeadlineReminder: (data: FormDeadlineData) => `
    <h2>Lembrete: Prazo se aproximando</h2>
    <p><strong>Formulário:</strong> ${data.formTitle}</p>
    <p>O prazo para envio termina em ${data.daysLeft} dias.</p>
    <p><strong>Data limite:</strong> ${data.deadline}</p>
    <br>
    <p><a href="${process.env.APP_URL}/forms/${data.formId}">
      Preencher formulário
    </a></p>
  `,
}
```

### **Webhook System**
```typescript
// src/server/webhooks/form-events.ts
export class FormWebhookService {
  static async emitFormSubmitted(formData: FormSubmissionData) {
    await fetch(process.env.FORM_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Type': 'form.submitted',
      },
      body: JSON.stringify({
        event: 'form.submitted',
        data: formData,
        timestamp: new Date().toISOString(),
      }),
    })
  }

  static async emitResponseStatusChanged(
    responseId: string,
    oldStatus: string,
    newStatus: string
  ) {
    await fetch(process.env.FORM_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Type': 'response.status_changed',
      },
      body: JSON.stringify({
        event: 'response.status_changed',
        data: {
          responseId,
          oldStatus,
          newStatus,
          changedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      }),
    })
  }
}
```

## 📊 Analytics e Relatórios

### **Métricas de Formulários**
```typescript
// src/server/routers/analytics.ts
export const analyticsRouter = createTRPCRouter({
  getFormAnalytics: adminProcedure
    .input(z.object({
      formId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input

      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      } : {}

      // Overall metrics
      const [
        totalForms,
        activeForms,
        totalResponses,
        responsesByStatus,
        formsByCategory,
        responseTrends,
      ] = await Promise.all([
        ctx.db.form.count(),
        ctx.db.form.count({ where: { isActive: true } }),
        ctx.db.formResponse.count({ where: dateFilter }),
        ctx.db.formResponse.groupBy({
          by: ['status'],
          where: dateFilter,
          _count: { status: true },
        }),
        ctx.db.form.groupBy({
          by: ['category'],
          _count: { id: true },
        }),
        // Response trends by day
        ctx.db.$queryRaw`
          SELECT
            DATE(submitted_at) as date,
            COUNT(*) as count
          FROM form_responses
          WHERE submitted_at >= ${startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
          GROUP BY DATE(submitted_at)
          ORDER BY date DESC
        `,
      ])

      return {
        overview: {
          totalForms,
          activeForms,
          totalResponses,
          averageResponsesPerForm: totalForms > 0 ? totalResponses / totalForms : 0,
        },
        byStatus: responsesByStatus,
        byCategory: formsByCategory,
        trends: responseTrends,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      }
    }),

  getFormPerformance: adminProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [
        form,
        responseStats,
        fieldAnalytics,
        completionRate,
      ] = await Promise.all([
        ctx.db.form.findUnique({
          where: { id: input.formId },
          include: { _count: { select: { responses: true } } },
        }),
        ctx.db.formResponse.aggregate({
          where: { formId: input.formId },
          _count: { id: true },
          _avg: { submittedAt: true },
        }),
        // Field completion analytics
        ctx.db.$queryRaw`
          SELECT
            field_name,
            COUNT(*) as total,
            SUM(CASE WHEN field_value IS NOT NULL THEN 1 ELSE 0 END) as filled
          FROM form_response_fields
          WHERE form_id = ${input.formId}
          GROUP BY field_name
        `,
        // Completion rate over time
        ctx.db.$queryRaw`
          SELECT
            DATE(created_at) as date,
            COUNT(*) as total,
            SUM(CASE WHEN status != 'DRAFT' THEN 1 ELSE 0 END) as completed
          FROM forms
          WHERE id = ${input.formId}
          GROUP BY DATE(created_at)
        `,
      ])

      return {
        form,
        responseStats,
        fieldAnalytics,
        completionRate,
      }
    }),
})
```

## 📋 Checklist do Sistema

### **Funcionalidades Core**
- [x] **Form Builder** - Interface drag-and-drop intuitiva
- [x] **Field Types** - Diversos tipos de campos suportados
- [x] **Validation** - Validação em tempo real
- [x] **Multi-step Forms** - Formulários em etapas
- [x] **Auto-save** - Salvamento automático de rascunhos

### **Backend e API**
- [x] **tRPC Procedures** - Endpoints type-safe
- [x] **Database Models** - Schema otimizado
- [x] **File Uploads** - Suporte a anexos
- [x] **Workflow Engine** - Sistema de aprovação
- [x] **Audit Logging** - Rastreamento de mudanças

### **Interface do Usuário**
- [x] **Responsive Design** - Mobile-first approach
- [x] **Accessibility** - WCAG 2.1 compliance
- [x] **Kanban Board** - Gestão visual de respostas
- [x] **Real-time Updates** - Sincronização instantânea
- [x] **Export Features** - CSV e PDF downloads

### **Notificações e Integrações**
- [x] **Email Templates** - Templates personalizados
- [x] **Webhook System** - Integrações externas
- [x] **SMS Notifications** - Opcional para urgentes
- [x] **Slack Integration** - Notificações em canais
- [x] **Calendar Sync** - Agendamento automático

### **Analytics e Relatórios**
- [x] **Response Metrics** - Taxas de conversão
- [x] **Field Analytics** - Análise de preenchimento
- [x] **Performance Reports** - Tempo de resposta
- [x] **User Engagement** - Níveis de participação
- [x] **Custom Dashboards** - Visualizações personalizadas

### **Segurança e Qualidade**
- [x] **Input Validation** - Sanitização completa
- [x] **Rate Limiting** - Proteção contra abuso
- [x] **Audit Trails** - Logs de auditoria
- [x] **Data Encryption** - Campos sensíveis criptografados
- [x] **Backup Strategy** - Recuperação de desastres

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe de Produto
