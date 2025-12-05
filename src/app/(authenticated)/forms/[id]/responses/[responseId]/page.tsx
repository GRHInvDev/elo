import { api } from "@/trpc/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusUpdateButton } from "@/components/forms/status-update-button"
import { ResponseDetails } from "@/components/forms/response-details"
import { EditResponseButton } from "@/components/forms/edit-response-button"
import { type Field } from "@/lib/form-types"
import { DashboardShell } from "@/components/dashboard-shell"
import { canAccessForm } from "@/lib/access-control"
import { formatFormResponseNumber } from "@/lib/utils/form-response-number"

export const metadata = {
  title: "Detalhes da Resposta",
  description: "Visualize os detalhes de uma resposta de formulário",
}

interface ResponseDetailsPageProps {
  params: Promise<{
    id: string
    responseId: string
  }>
}

export default async function ResponseDetailsPage({ params }: ResponseDetailsPageProps) {
  const {id, responseId} = await params;

  const userData = await api.user.me()
  const response = await api.formResponse.getById(responseId)

  if (!response) {
    notFound()
  }

  // Verificar se o usuário pode acessar o formulário
  if (!canAccessForm(
    userData?.role_config,
    id,
    userData?.id,
    {
      userId: response.form.userId,
      isPrivate: response.form.isPrivate,
      allowedUsers: response.form.allowedUsers,
      allowedSectors: response.form.allowedSectors,
    },
    userData?.setor
  )) {
    redirect("/forms")
  }

  // Verificar se a resposta pertence ao formulário correto
  if (response.formId !== id) {
    notFound()
  }

  const currentUserId = typeof userData?.id === "string" ? userData.id : ""
  const ownerIds = Array.isArray((response)?.form?.ownerIds) ? (response).form.ownerIds : []
  const isOwner = response.form.userId === currentUserId || ownerIds.includes(currentUserId)
  const isAuthor = response.userId === userData?.id

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
    <DashboardShell>
      <div className="mb-8">
        <Link href={`/forms/${id}/responses`}>
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para respostas
          </Button>
        </Link>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            {response.number && (
              <span className="text-lg font-mono text-muted-foreground">
                {formatFormResponseNumber(response.number)}
              </span>
            )}
            <h1 className="text-3xl font-bold tracking-tight">Detalhes da Resposta</h1>
          </div>
          <p className="text-muted-foreground mt-2">Formulário: {response.form.title}</p>
        </div>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-y-4 justify-between items-center md:items-start">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <Avatar>
                  <AvatarImage src={response.user.imageUrl ?? ""} alt={response.user.firstName ?? "Usuário"} />
                  <AvatarFallback>
                    {response.user.firstName?.charAt(0) ?? response.user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="overflow-hidden text-xl md:text-2xl text-center md:text-start overflow-ellipsis">
                    {response.user.firstName
                      ? `${response.user.firstName} ${response.user.lastName ?? ""}`
                      : response.user.email}
                  </CardTitle>
                  <CardDescription className="overflow-hidden text-center md:text-start overflow-ellipsis">{response.user.email}</CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(response.status)}
                {response.statusComment && (
                  <p className="text-sm text-muted-foreground max-w-[300px] text-right">{response.statusComment}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Data de envio:</p>
                <p className="font-medium">
                  {format(new Date(response.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Última atualização:</p>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(response.updatedAt), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <EditResponseButton
            responseId={response.id}
            formId={id}
            isOwner={isOwner}
            isAuthor={isAuthor}
          />
          {isOwner && (
            <StatusUpdateButton
              responseId={response.id}
              currentStatus={response.status}
              currentComment={response.statusComment ?? ""}
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Respostas</CardTitle>
            <CardDescription>Detalhes das respostas enviadas pelo usuário</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponseDetails 
              responseData={response.responses as Record<string, string | number | string[] | File[] | null | undefined>[]} 
              formFields={response.form.fields as unknown as Field[]} 
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

