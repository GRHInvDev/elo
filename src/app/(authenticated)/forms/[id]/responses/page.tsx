import { redirect } from "next/navigation"
import { api } from "@/trpc/server"
import { canAccessForm, canEditForm } from "@/lib/access-control"

interface ResponsesPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ResponsesPage({ params }: ResponsesPageProps) {
  const { id } = await params

  const userData = await api.user.me()
  const form = await api.form.getById(id)

  if (!form) {
    redirect("/forms")
  }

  // Verificar se o usuário pode acessar o formulário
  if (
    !canAccessForm(
      userData?.role_config,
      id,
      userData?.id,
      {
        userId: form.userId,
        isPrivate: form.isPrivate,
        allowedUsers: form.allowedUsers,
        allowedSectors: form.allowedSectors,
      },
      userData?.setor,
    )
  ) {
    redirect("/forms")
  }

  const canEdit = canEditForm(
    userData?.role_config,
    userData?.id,
    form.id,
    {
      userId: form.userId,
      ownerIds: form.ownerIds,
      isPrivate: form.isPrivate,
      allowedUsers: form.allowedUsers,
      allowedSectors: form.allowedSectors,
    },
    userData?.setor,
  )

  if (canEdit) {
    redirect(`/forms/central?formId=${id}`)
  }

  redirect("/forms/my-responses")
}
