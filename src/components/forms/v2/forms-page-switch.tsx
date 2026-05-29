"use client"

import * as React from "react"

import { useLayoutPreference } from "@/contexts/layout-preference-context"

interface FormsPageSwitchProps {
  classic: React.ReactNode
  v2: React.ReactNode
}

export function FormsPageSwitch({ classic, v2 }: FormsPageSwitchProps) {
  const { layout, ready } = useLayoutPreference()
  if (!ready) {
    return <>{classic}</>
  }
  return <>{layout === "v2" ? v2 : classic}</>
}
