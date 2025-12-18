"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Edit } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface EmotionRulerListProps {
  rulers: Array<{
    id: string
    question: string
    isActive: boolean
    startDate: Date | null
    endDate: Date | null
    backgroundColor: string | null
    emotions: Array<{
      id: string
      value: number
      emoji: string | null
      color: string
      states: string[]
      order: number
    }>
    _count: {
      responses: number
      dailyAccesses: number
    }
    createdAt: Date
    updatedAt: Date
  }>
  isLoading: boolean
  onEdit: (rulerId: string) => void
  onRefresh?: () => void
}

export function EmotionRulerList({
  rulers,
  isLoading,
  onEdit,
}: EmotionRulerListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (rulers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma régua criada ainda. Clique em &quot;Nova Régua&quot; para começar.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {rulers.map((ruler) => (
        <Card key={ruler.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">{ruler.question}</CardTitle>
                  {ruler.isActive && (
                    <Badge variant="default">Ativa</Badge>
                  )}
                </div>
                <CardDescription>
                  Criada em {format(new Date(ruler.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(ruler.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Datas */}
              {(ruler.startDate ?? ruler.endDate) && (
                <div className="text-sm text-muted-foreground">
                  {ruler.startDate && (
                    <span>
                      Início: {format(new Date(ruler.startDate), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                  {ruler.startDate && ruler.endDate && " • "}
                  {ruler.endDate && (
                    <span>
                      Fim: {format(new Date(ruler.endDate), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              )}

              {/* Níveis */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Níveis:</span>
                {ruler.emotions
                  .sort((a, b) => a.order - b.order)
                  .map((emotion) => (
                    <div
                      key={emotion.id}
                      className="flex items-center gap-1 px-2 py-1 rounded border text-xs"
                      style={{ borderColor: emotion.color }}
                    >
                      <span className="text-base">{emotion.emoji ?? "•"}</span>
                      <span>Nível {emotion.value}</span>
                      {emotion.states?.length > 0 && (
                        <span className="text-muted-foreground">
                          ({emotion.states.length} estados)
                        </span>
                      )}
                    </div>
                  ))}
              </div>

              {/* Estatísticas */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                <span>
                  <strong className="text-foreground">{ruler._count.responses}</strong> respostas
                </span>
                <span>
                  <strong className="text-foreground">{ruler._count.dailyAccesses}</strong> acessos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
