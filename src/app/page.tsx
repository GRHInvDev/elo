import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"

export default async function HomePage() {
  const user = await currentUser()

  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/sign-in")
  }
}

