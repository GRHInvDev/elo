"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCallback } from "react"

const enterprises = [
  { value: "NA", label: "NA" },
  { value: "Box", label: "Box" },
  { value: "RHenz", label: "RHenz" },
  { value: "Cristallux", label: "Cristallux" },
]

export function EnterpriseFilter({
  selectedEnterprise,
}: {
  selectedEnterprise?: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  const handleEnterpriseChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams()
      if (value) {
        params.set("enterprise", value)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router],
  )

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedEnterprise ?? ""} onValueChange={handleEnterpriseChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todas as empresas" />
        </SelectTrigger>
        <SelectContent>
          {enterprises.map((enterprise) => (
            <SelectItem key={enterprise.value} value={enterprise.value}>
              {enterprise.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedEnterprise && (
        <Button variant="ghost" size="sm" onClick={() => handleEnterpriseChange("")}>
          Limpar filtro
        </Button>
      )}
    </div>
  )
}

