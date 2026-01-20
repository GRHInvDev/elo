"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Field, getFieldTypeLabel } from "@/lib/form-types"
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FieldListProps {
  fields: Field[]
  selectedFieldId: string | null
  onSelectField: (id: string) => void
  onRemoveField: (id: string) => void
  onMoveField: (id: string, direction: "up" | "down") => void
}

export function FieldList({ fields, selectedFieldId, onSelectField, onRemoveField, onMoveField }: FieldListProps) {
  if (fields.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">Nenhum campo adicionado</div>
  }

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <Card
          key={field.id}
          className={cn(
            "cursor-pointer border transition-colors",
            selectedFieldId === field.id ? "border-primary" : "hover:border-muted-foreground/50",
          )}
          onClick={() => onSelectField(field.id)}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{field.label || "Sem título"}</p>
                {field.showInList && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-600 border-blue-200">
                    Visível na lista
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{getFieldTypeLabel(field.type)}</p>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveField(field.id, "up")
                }}
                disabled={index === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveField(field.id, "down")
                }}
                disabled={index === fields.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveField(field.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

