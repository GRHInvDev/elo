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
    public_metadata: { admin?: boolean; isTotem?: boolean }
  }

  // Handle the webhook
  switch (evt.type) {
    case "user.created":
      // SISTEMA SIMPLIFICADO: Todos podem ver tudo, só alguns podem criar
      let initialConfig = {
        sudo: false,
        // Permissões de criação - todas false por padrão
        can_create_form: false,
        can_create_event: false,
        can_create_flyer: false,
        can_create_booking: false,
        can_locate_cars: false,
        // Admin pages apenas para sudos
        admin_pages: [] as string[],
        isTotem: public_metadata?.isTotem ?? false
      };

      if (public_metadata?.admin) {
        initialConfig = {
          sudo: true,
          // Admin pode criar tudo
          can_create_form: true,
          can_create_event: true,
          can_create_flyer: true,
          can_create_booking: true,
          can_locate_cars: true,
          admin_pages: ["/admin", "/food", "/rooms", "/ideas", "/birthday"] as string[],
          isTotem: false
        };
      }

      await db.user.create({
        data: {
          id,
          email: email_addresses.at(0)?.email_address ?? "",
          firstName: first_name ?? "",
          lastName: last_name ?? "",
          imageUrl: image_url,
          role_config: initialConfig,
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
          // Manter role_config existente, apenas atualizar dados pessoais
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

