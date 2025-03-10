"use client"

import { useState } from "react"
import { Loader2, Upload } from "lucide-react"

import { api } from "@/trpc/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { addDays } from "date-fns"

export function BirthdayImport() {
  const [csvData, setCsvData] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const utils = api.useUtils()

  const importBirthdays = api.birthday.importBirthdays.useMutation({
    onSuccess: () => {
      toast({
        title: "Aniversários importados",
        description: "Os aniversários foram importados com sucesso.",
      })
      setCsvData("")
      utils.birthday.list.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
    onSettled: () => {
      setIsProcessing(false)
    },
  })

  const handleImport = async () => {
    try {
      setIsProcessing(true)

      // Parse CSV data
      const lines = csvData.trim().split("\n")
      const birthdays = lines.slice(1).map((line) => {
        const parts = line.split(",").map((item) => item.trim())

        if (parts.length < 2) {
          throw new Error(`Linha inválida: ${line}`)
        }

        const name = parts[0]
        const dateStr = parts[1] as string

        // Parse date (assuming format is DD/MM/YYYY)
        const dateParts = dateStr.split("/").map(Number)

        if (dateParts.length !== 3) {
          throw new Error(`Formato de data inválido: ${dateStr}. Use DD/MM/AAAA.`)
        }

        const [day, month, year] = dateParts

        if (isNaN(day!) || isNaN(month!) || isNaN(year!)) {
          throw new Error(`Data inválida: ${dateStr}`)
        }
        const date = new Date(year!, month! - 1, day)

        if (isNaN(date.getTime())) {
            throw new Error(`Data inválida: ${dateStr}`)
        }

        return {
          name,
          data: addDays(date, 1),
        }
      })

      if (birthdays.length === 0) {
        throw new Error("Nenhum aniversário encontrado no CSV")
      }

      importBirthdays.mutate(birthdays.map((b)=>({...b, name: b.name ?? "", userId: undefined})));
    } catch (error) {
      toast({
        title: "Erro ao processar CSV",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Aniversários</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Cole os dados CSV abaixo para importar múltiplos aniversários de uma vez. O formato deve ser:{" "}
            <code>Nome,DD/MM/AAAA</code> (com cabeçalho).

            exemplo:<br/><br/>

            Nome,Data<br/>
            João Silva,01/05/1990<br/>
            Maria Oliveira,15/08/1985
          </p>
          <Textarea
            placeholder="Cole os dados aqui..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            rows={10}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleImport} disabled={!csvData.trim() || isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Importar Aniversários
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

