import { api } from "@/trpc/server"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, FileText } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

export async function UserResponsesList() {
  const responses = await api.formResponse.listUserResponses()

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhuma resposta encontrada</h3>
        <p className="text-muted-foreground mt-1 mb-4">Você ainda não respondeu nenhum formulário.</p>
        <Link href="/forms">
          <Button>Ver Formulários Disponíveis</Button>
        </Link>
      </div>
    )
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "NOT_STARTED":
        return (
          <Badge variant="outline" className="bg-muted">
            Não iniciado
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Em andamento
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Concluído
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {responses.map((response) => (
          <Card key={response.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{response.form.title}</CardTitle>
                  <CardDescription>
                    Enviado {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true, locale: ptBR })}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(response.status)}
                  {response.statusComment && (
                    <p className="text-sm text-muted-foreground max-w-[200px] text-right">{response.statusComment}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{response.form.description ?? "Sem descrição"}</div>
            </CardContent>
            <CardFooter className="flex flex-col md:flex-row gap-y-2 justify-between pt-3 border-t">
              <Link className="w-full md:w-auto" href={`/forms/${response.formId}`}>
                <Button variant="outline" size="sm" className="w-full md:w-auto">
                  <FileText className="h-4 w-4 mr-1" />
                  Ver Formulário
                </Button>
              </Link>
              <Link className="w-full md:w-auto" href={`/forms/${response.formId}/responses/${response.id}`}>
                <Button size="sm" className="w-full md:w-auto">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalhes
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

