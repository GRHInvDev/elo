import { cn } from "@/lib/utils"

type DashboardShellProps = React.HTMLAttributes<HTMLDivElement>

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div className={cn("flex-1 space-y-4 p-4 sm:p-8 pt-6 w-full min-w-0 max-w-full overflow-x-hidden", className)} {...props}>
      {children}
    </div>
  )
}
