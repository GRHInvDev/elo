"use client"

import { UserButton } from "@clerk/nextjs"

export function UserNav() {
  return (
    <div className="flex items-center gap-4">
      <UserButton signInUrl="/" />
    </div>
  )
}

