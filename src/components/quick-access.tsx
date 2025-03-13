import type React from "react"
import { Calendar, MapPin, NewspaperIcon } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const items = [
  {
    title: "Agendar Sala",
    description: "Reserve salas de reunião",
    icon: MapPin,
    href: "/rooms",
  },
  {
    title: "Eventos",
    description: "Confira os próximos eventos",
    icon: Calendar,
    href: "/events",
  },
  {
    title: "Encartes",
    description: "Acesse os encartes digitais",
    icon: NewspaperIcon,
    href: "/flyers",
  },
]

type QuickAccessProps = React.HTMLAttributes<HTMLDivElement>

export function QuickAccess({ className, ...props }: QuickAccessProps) {
  return (
    <div className={className} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className="group relative rounded-lg border p-4 hover:bg-muted">
                <div className="flex h-full flex-col justify-between">
                  <div className="space-y-2">
                    <item.icon className="h-4 w-4" />
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

