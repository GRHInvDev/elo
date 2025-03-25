"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { FieldTypeSelector } from "@/components/forms/field-type-selector"
import { FieldEditor } from "@/components/forms/field-editor"
import { FormPreview } from "@/components/forms/form-preview"
import { FieldList } from "@/components/forms/field-list"
import { type Field, type FieldType, createDefaultField } from "@/lib/form-types"

export function FormBuilder({fields, setFields}:{fields: Field[], setFields: (fields: Field[])=>void}) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState("Novo Formulário")

  const selectedField = fields.find((field) => field.id === selectedFieldId)

  const addField = (type: FieldType) => {
    const newField = createDefaultField(type)
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
  }

  const updateField = (updatedField: Field) => {
    setFields(fields.map((field) => (field.id === updatedField.id ? updatedField : field)))
  }

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id))
    if (selectedFieldId === id) {
      setSelectedFieldId(null)
    }
  }

  const moveField = (id: string, direction: "up" | "down") => {
    const index = fields.findIndex((field) => field.id === id)
    if ((direction === "up" && index === 0) || (direction === "down" && index === fields.length - 1)) {
      return
    }

    const newFields = [...fields]
    const newIndex = direction === "up" ? index - 1 : index + 1
    const [movedField] = newFields.splice(index, 1)
    newFields.splice(newIndex, 0, movedField!)

    setFields(newFields)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Campos do Formulário</h2>
            <div className="mb-6">
              <FieldList
                fields={fields}
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
                onRemoveField={removeField}
                onMoveField={moveField}
              />
            </div>
            <FieldTypeSelector onSelect={addField} />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Visualização</TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
            <Card>
              <CardContent className="p-6">
                {selectedField ? (
                  <FieldEditor field={selectedField} onChange={updateField} />
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    Selecione um campo para editar ou adicione um novo campo
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardContent className="p-6">
                <FormPreview title={formTitle} setTitle={setFormTitle} fields={fields} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

