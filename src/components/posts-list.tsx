import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PostsListProps = React.HTMLAttributes<HTMLDivElement>

export function PostsList({ className, ...props }: PostsListProps) {
  return (
    <div className={className} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Últimas Notícias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Aqui viriam os posts do banco de dados */}
            <div className="flex items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Novo Sistema de Reservas</p>
                <p className="text-sm text-muted-foreground">Conheça o novo sistema de reserva de salas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

