/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Webhook } from "svix"
import { headers } from "next/headers"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { db } from "@/server/db"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env")
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occured", {
      status: 400,
    })
  }

  const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data as {
    id: string
    email_addresses: { email_address: string }[]
    first_name: string | null
    last_name: string | null
    image_url: string
    public_metadata: { role?: string }
  }

  // Handle the webhook
  switch (evt.type) {
    case "user.created":
      await db.user.create({
        data: {
          id,
          email: email_addresses.at(0)?.email_address ?? "",
          firstName: first_name ?? "",
          lastName: last_name ?? "",
          imageUrl: image_url,
          role: public_metadata?.role === "admin" ? "ADMIN" : "USER",
        },
      })
      break
    case "user.updated":
      await db.user.update({
        where: { id },
        data: {
          email: email_addresses[0]?.email_address ?? "",
          firstName: first_name ?? "",
          lastName: last_name ?? "",
          imageUrl: image_url,
          role: public_metadata?.role === "admin" ? "ADMIN" : "USER",
        },
      })
      break
    case "user.deleted":
      await db.user.delete({
        where: { id },
      })
      break
  }

  return new Response("", { status: 200 })
}

