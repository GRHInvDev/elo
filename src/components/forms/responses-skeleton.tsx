import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ResponsesSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-48" />
          </CardContent>
          <CardFooter className="flex justify-between pt-3 border-t">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-36" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

