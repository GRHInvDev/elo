"use client"

import dynamic from "next/dynamic"
import { AppReleaseNotesDialog } from "./app-release-notes-dialog"
import { SettingsMenu } from "./settings-menu"

const UserButton = dynamic(
  () => import("@clerk/nextjs").then((m) => m.UserButton),
  { ssr: false },
)

export function UserNav() {
  return (
    <div className="flex items-center gap-4 transition-all duration-300">
      <div className="hidden md:flex items-center gap-0.5">
        <AppReleaseNotesDialog size="small" />
        <SettingsMenu size="small" />
      </div>
      <UserButton signInUrl="/" />
    </div>
  )
}

