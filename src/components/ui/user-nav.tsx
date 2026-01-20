"use client"

import { UserButton } from "@clerk/nextjs"
import { SettingsMenu } from "./settings-menu"

export function UserNav() {
  return (
    <div className="flex items-center gap-4 transition-all duration-300">
      <div className="hidden md:flex">
        <SettingsMenu size="small"/>
      </div>
      <UserButton signInUrl="/" />
    </div>
  )
}

