"use client"

import { UserButton } from "@clerk/nextjs"
import { SettingsMenu } from "./settings-menu"

export function UserNav() {
  return (
    <div className="flex items-center gap-4">
      <SettingsMenu size="small"/>
      <UserButton signInUrl="/" />
    </div>
  )
}

