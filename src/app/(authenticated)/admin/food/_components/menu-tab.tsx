"use client"

import { Card } from "@/components/ui/card"
import MenuEditor from "../_components/menu-editor"

export default function MenuTab() {
  return (
    <div className="space-y-4">
      <Card>
        <MenuEditor />
      </Card>
    </div>
  )
}
