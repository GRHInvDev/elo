import { redirect } from "next/navigation"
import { api } from "@/trpc/server"
import { TRPCError } from "@trpc/server"

interface ResponseDetailsPageProps {
  params: Promise<{
    id: string
    responseId: string
  }>
}

export default async function ResponseDetailsPage({ params }: ResponseDetailsPageProps) {
  const { responseId } = await params

  const userData = await api.user.me()
  let response: Awaited<ReturnType<typeof api.formResponse.getById>> | null = null

  try {
    response = await api.formResponse.getById(responseId)
  } catch (error) {
    if (error instanceof TRPCError && error.code === "FORBIDDEN") {
      redirect("/forms/my-responses")
    }
    redirect("/forms")
  }

  if (!response) {
    redirect("/forms")
  }

  const currentUserId = typeof userData?.id === "string" ? userData.id : ""
  const ownerIds = Array.isArray(response.form?.ownerIds) ? response.form.ownerIds : []
  const isOwner = response.form.userId === currentUserId || ownerIds.includes(currentUserId)

  if (isOwner) {
    redirect(`/forms/central?responseId=${responseId}`)
  }

  redirect(`/forms/my-responses?responseId=${responseId}`)
}
