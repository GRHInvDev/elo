"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FileSpreadsheet } from "lucide-react"

interface FormSpreadsheetExportSettingsProps {
  enabled: boolean
  onEnabledChange: (value: boolean) => void
}

/**
 * Habilita o botão de exportação CSV na página de respostas (apenas para criador e responsáveis).
 */
export function FormSpreadsheetExportSettings({ enabled, onEnabledChange }: FormSpreadsheetExportSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Exportação em planilha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Quando ativado, criador e responsáveis podem baixar um arquivo CSV com as respostas, escolhendo o período e
          quais campos do formulário incluir.
        </p>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="spreadsheetExport"
            checked={enabled}
            onCheckedChange={(checked) => onEnabledChange(checked === true)}
          />
          <Label htmlFor="spreadsheetExport" className="font-medium">
            Permitir exportação CSV na tela de respostas
          </Label>
        </div>
      </CardContent>
    </Card>
  )
}
