"use client"

import { UserButton } from "@clerk/nextjs"
import { SettingsMenu } from "@/components/settings-menu"

export function UserNav() {
  return (
    <div className="flex items-center gap-4">
      <SettingsMenu />
      <UserButton signInUrl="/" />
    </div>
  )
}

