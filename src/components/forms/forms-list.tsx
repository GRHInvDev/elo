import { api } from "@/trpc/server"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, FileText, PlusCircle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { type Field } from "@/lib/form-types"
import { auth } from "@clerk/nextjs/server"
import { DeleteFormButton } from "./delete-form-button"
import { getAccessibleForms, canCreateForm } from "@/lib/access-control"

export async function FormsList() {
  const allForms = await api.form.list()
  const user = await auth()
  const db_user = await api.user.me()
  
  // Filtrar formulários baseado nas permissões do usuário
  const forms = getAccessibleForms(db_user?.role_config, allForms)
  const userCanCreateForm = canCreateForm(db_user?.role_config);

  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">
          {userCanCreateForm ? "Nenhum formulário encontrado" : "Nenhum formulário disponível"}
        </h3>
        <p className="text-muted-foreground mt-1 mb-4">
          {userCanCreateForm
            ? "Comece criando seu primeiro formulário personalizado."
            : allForms.length === 0
            ? "Ainda não há formulários criados no sistema."
            : "Não há formulários disponíveis para você no momento."}
        </p>
        {userCanCreateForm && (
          <Link href="/forms/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Formulário
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.map((form) => (
        <Card key={form.id} className="flex flex-col">
          <CardHeader>
            <h1 className="min-h-content text-lg text-wrap overflow-visible max-w-full font-bold">{form.title}</h1>
            <CardDescription>
              Criado {formatDistanceToNow(new Date(form.createdAt), { addSuffix: true, locale: ptBR })}
            </CardDescription>
            {
              user.userId === form.userId &&
              <div className="flex gap-4 items-center">
                <Link href={`/forms/${form.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </Link>
                <DeleteFormButton formId={form.id} formTitle={form.title}/>
              </div>
            }
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">{form.description ?? "Sem descrição"}</p>
            <div className="mt-2 text-sm text-muted-foreground">{(form.fields as unknown as Field[]).length} campos</div>
          </CardContent>
          <CardFooter className="flex justify-between gap-2 pt-2">
            <div className="flex gap-2">
              <Link href={`/forms/${form.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </Link>
            </div>
            <Link href={`/forms/${form.id}/respond`}>
              <Button size="sm">
                <FileText className="h-4 w-4 mr-1" />
                Abrir nova solicitação
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

